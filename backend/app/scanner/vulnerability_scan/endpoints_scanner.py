import os
import json
import logging
import asyncio
import asyncio.subprocess
import subprocess
from datetime import datetime
from typing import Callable, Coroutine, Optional, List, Dict
from urllib.parse import urlparse
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from app.db.db import db

load_dotenv()

logger = logging.getLogger(__name__)

class ScannerService:
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.ec2_host = os.getenv("EC2_HOST")
        self.ec2_user = os.getenv("EC2_USER", "ubuntu")
        self.ec2_key_path = os.getenv("EC2_KEY_PATH", "monsmith-key.pem")
        
        if self.groq_api_key:
            self.llm = ChatGroq(
                temperature=0,
                groq_api_key=self.groq_api_key,
                model_name="llama-3.3-70b-versatile"
            )
        else:
            self.llm = None
            logger.warning("GROQ_API_KEY not found. AI reporting will be disabled.")

    async def _update_status(self, job_id: str, status_data: dict):
        """Log job status."""
        if not job_id:
            return
        logger.info(f"Job {job_id} status update: {status_data}")

    async def _run_command(self, cmd_list: List[str], input_str: Optional[str] = None) -> str:
        """
        Run a command on the remote EC2 instance inside the 'api-scanner' docker container.
        """
        if not self.ec2_host:
            logger.error("EC2_HOST not configured. Falling back to local execution (likely to fail).")
            return await self._run_local_command(cmd_list, input_str)

        # Construct the command to run inside the docker container
        # Use full paths for reliability
        full_cmd_list = []
        for c in cmd_list:
            if c == "subfinder": full_cmd_list.append("/root/go/bin/subfinder")
            elif c == "httpx": full_cmd_list.append("/root/go/bin/httpx")
            elif c == "nuclei": full_cmd_list.append("/root/go/bin/nuclei")
            elif c == "ffuf": full_cmd_list.append("/root/go/bin/ffuf")
            elif c == "subzy": full_cmd_list.append("/root/go/bin/subzy")
            elif c == "nmap": full_cmd_list.append("/usr/bin/nmap")
            else: full_cmd_list.append(c)

        inner_cmd = " ".join(full_cmd_list)
        # Wrap it for SSH and Docker exec
        ssh_cmd = [
            "ssh", "-i", self.ec2_key_path,
            "-o", "StrictHostKeyChecking=no",
            "-o", "ConnectTimeout=10",
            f"{self.ec2_user}@{self.ec2_host}",
            f"docker exec -i api-scanner bash -c \"{inner_cmd}\""
        ]

        try:
            logger.info(f"Executing Remote: {' '.join(ssh_cmd)}")
            process = await asyncio.create_subprocess_exec(
                *ssh_cmd,
                stdin=asyncio.subprocess.PIPE if input_str else None,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate(input=input_str.encode() if input_str else None)
            
            if process.returncode != 0:
                err_msg = stderr.decode().strip()
                out_msg = stdout.decode().strip()
                full_error = f"Exit {process.returncode}: {err_msg}"
                if out_msg: 
                    full_error += f" | Out: {out_msg[:100]}"
                logger.error(f"Remote command failed: {inner_cmd} | {full_error}")
                return out_msg if out_msg else full_error
                
            return stdout.decode().strip()
        except Exception as e:
            logger.error(f"Remote execution error for {inner_cmd}: {e}")
            return f"Error: {str(e)}"

    async def _run_local_command(self, cmd_list: List[str], input_str: Optional[str] = None) -> str:
        """Fallback local execution."""
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd_list,
                stdin=asyncio.subprocess.PIPE if input_str else None,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate(input=input_str.encode() if input_str else None)
            return stdout.decode().strip()
        except Exception as e:
            return f"Local Error: {str(e)}"

    async def run_scan(self, target: str, user_email: str, job_id: str = None, on_progress: Callable[[dict], Coroutine] = None):
        """
        Orchestrate the vulnerability scan flow using direct tool calls.
        """
        results: dict = {
            "target": target,
            "subdomains": [],
            "live_domains": [],
            "endpoints": [],
            "ports": "",
            "vulnerabilities": "",
            "raw_output": ""
        }

        # Clean Target: Extract hostname if it's a URL
        clean_target = target
        if "://" in target:
            clean_target = urlparse(target).hostname or target
        
        logger.info(f"Cleaned target for scanner tools: {clean_target}")

        try:
            if on_progress:
                await on_progress({"stage": "init", "message": f"Starting scan for {clean_target}..."})
            await self._update_status(job_id, {"current_stage": "init", "message": f"Starting scan for {clean_target}..."})

            # Stage 1: Subdomains (Subfinder)
            if on_progress:
                await on_progress({"stage": "subdomains", "message": "Enumerating subdomains..."})
            await self._update_status(job_id, {"current_stage": "subdomains", "message": "Enumerating subdomains..."})
            
            subdomains_out = await self._run_command(["subfinder", "-d", clean_target, "-silent"])
            results["subdomains"] = [s.strip() for s in subdomains_out.splitlines() if s.strip()]
            results["raw_output"] += f"\n--- SUBDOMAINS ---\n{subdomains_out}"

            # Stage 2: Live Domains (Httpx)
            if on_progress:
                await on_progress({"stage": "live_domains", "message": "Checking for live domains..."})
            await self._update_status(job_id, {"current_stage": "live_domains", "message": "Checking for live domains..."})
            
            targets_input = "\n".join([clean_target] + results["subdomains"])
            httpx_out = await self._run_command(["httpx", "-silent"], input_str=targets_input)
            results["live_domains"] = [s.strip() for s in httpx_out.splitlines() if s.strip()]
            results["raw_output"] += f"\n--- LIVE DOMAINS ---\n{httpx_out}"

            # Stage 3: Endpoints (FFUF)
            if on_progress:
                await on_progress({"stage": "endpoints", "message": "Fuzzing for endpoints..."})
            await self._update_status(job_id, {"current_stage": "endpoints", "message": "Fuzzing for endpoints..."})
            
            # Note: Ensure /opt/seclists/Discovery/Web-Content/common.txt exists inside the container
            # FFUF usually needs a full URL with FUZZ, but we should use the cleaned target
            ffuf_url = f"http://{clean_target}/FUZZ"
            ffuf_out = await self._run_command([
                "ffuf", "-u", ffuf_url, 
                "-w", "/opt/seclists/Discovery/Web-Content/common.txt", 
                "-mc", "200,301,302", "-silent"
            ])
            results["endpoints"] = [s.strip() for s in ffuf_out.splitlines() if s.strip()]
            results["raw_output"] += f"\n--- ENDPOINTS ---\n{ffuf_out}"

            # Stage 4: Ports (Nmap)
            if on_progress:
                await on_progress({"stage": "ports", "message": "Scanning for open ports..."})
            await self._update_status(job_id, {"current_stage": "ports", "message": "Scanning for open ports..."})
            
            nmap_out = await self._run_command(["nmap", "-F", clean_target])
            results["ports"] = nmap_out
            results["raw_output"] += f"\n--- PORTS ---\n{nmap_out}"

            # Stage 5: Vulnerabilities (Nuclei & Subzy)
            if on_progress:
                await on_progress({"stage": "vulnerabilities", "message": "Scanning for vulnerabilities..."})
            await self._update_status(job_id, {"current_stage": "vulnerabilities", "message": "Scanning for vulnerabilities..."})
            
            nuclei_out = await self._run_command(["nuclei", "-u", clean_target, "-silent"])
            
            # Subzy using stdin targets
            subzy_out = await self._run_command(
                ["subzy", "run", "--targets", "/dev/stdin"],
                input_str=targets_input
            )
            
            results["vulnerabilities"] = f"Nuclei:\n{nuclei_out}\n\nSubzy:\n{subzy_out}"
            results["raw_output"] += f"\n--- VULNERABILITIES ---\n{results['vulnerabilities']}"

            # Stage 6: AI Report
            if on_progress:
                await on_progress({"stage": "report", "message": "Generating AI security report..."})
            await self._update_status(job_id, {"current_stage": "report", "message": "Generating AI security report..."})
            
            ai_report = None
            if self.llm:
                ai_report = await self._generate_ai_report(results)
                results["ai_report"] = ai_report
            else:
                results["ai_report"] = {"error": "AI reporting disabled"}

            # Save to MongoDB
            scan_doc = {
                "job_id": job_id,
                "user_email": user_email,
                "target": target,
                "status": "completed",
                "current_stage": "completed",
                "message": "Scan completed successfully!",
                "results": results,
                "created_at": datetime.utcnow(),
                "completed_at": datetime.utcnow()
            }
            await db.scans.insert_one(scan_doc)

            if on_progress:
                await on_progress({"stage": "completed", "message": "Scan completed successfully!", "results": results})
            await self._update_status(job_id, {"status": "completed", "current_stage": "completed", "message": "Scan completed!", "results": results})

        except Exception as e:
            logger.error(f"Scan failed: {e}")
            if on_progress:
                await on_progress({"stage": "error", "message": f"Scan failed: {str(e)}"})
            await self._update_status(job_id, {"status": "failed", "message": f"Scan failed: {str(e)}"})
            
            await db.scans.insert_one({
                "job_id": job_id,
                "user_email": user_email,
                "target": target,
                "status": "failed",
                "message": str(e),
                "created_at": datetime.utcnow()
            })

        return results

    async def run_repo_scan(self, repo_url: str, user_email: str, job_id: str, token: Optional[str] = None, on_progress: Optional[Callable[[dict], Coroutine]] = None):
        """
        Clone a GitHub repository and run scans on it.
        """
        results = {
            "target": repo_url,
            "type": "repo",
            "zombie_findings": [],
            "vulnerabilities": [],
            "raw_output": ""
        }

        try:
            if on_progress:
                await on_progress({"stage": "init", "message": f"Starting repository scan for {repo_url}..."})

            # Stage 1: Clone Repo
            if on_progress:
                await on_progress({"stage": "cloning", "message": "Cloning repository..."})
            
            # Use token for private repos if available
            auth_url = repo_url
            if token:
                # repo_url usually looks like https://github.com/user/repo.git
                auth_url = repo_url.replace("https://", f"https://x-access-token:{token}@")

            temp_dir = f"/tmp/scan_{job_id}"
            clone_out = await self._run_command(["git", "clone", auth_url, temp_dir])
            results["raw_output"] += f"\n--- CLONE ---\n{clone_out}"

            # Stage 2: Zombie Scan (Example tool call)
            if on_progress:
                await on_progress({"stage": "zombie", "message": "Running Zombie API scan..."})
            
            # Assuming zombie-scan.py is in the container at a known path
            zombie_out = await self._run_command(["python3", "/root/scanner/zombie/zombie-scan.py", "--path", temp_dir])
            results["raw_output"] += f"\n--- ZOMBIE SCAN ---\n{zombie_out}"
            
            # Stage 3: Vulnerability Scan (Bandit for Python, etc.)
            if on_progress:
                await on_progress({"stage": "vulnerabilities", "message": "Running static analysis..."})
            
            bandit_out = await self._run_command(["bandit", "-r", temp_dir, "-f", "json", "-ll"])
            results["raw_output"] += f"\n--- STATIC ANALYSIS ---\n{bandit_out}"

            # Clean up
            await self._run_command(["rm", "-rf", temp_dir])

            # Stage 4: AI Report
            if on_progress:
                await on_progress({"stage": "report", "message": "Generating AI security report..."})
            
            if self.llm:
                results["ai_report"] = await self._generate_ai_report(results)
            
            # Save to MongoDB
            scan_doc = {
                "job_id": job_id,
                "user_email": user_email,
                "target": repo_url,
                "type": "repo",
                "status": "completed",
                "results": results,
                "created_at": datetime.utcnow()
            }
            await db.scans.insert_one(scan_doc)

            if on_progress:
                await on_progress({"stage": "completed", "message": "Repository scan completed!", "results": results})

        except Exception as e:
            logger.error(f"Repo scan failed: {e}")
            if on_progress:
                await on_progress({"stage": "error", "message": str(e)})
            await db.scans.insert_one({
                "job_id": job_id,
                "user_email": user_email,
                "target": repo_url,
                "status": "failed",
                "message": str(e),
                "created_at": datetime.utcnow()
            })

        return results

    async def _generate_ai_report(self, results: dict) -> dict:
        """Use Langchain/Groq to parse findings into a structured report."""
        if not self.llm:
            return {"error": "AI disabled"}
            
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a cybersecurity expert. Analyze scan results and output STRICT JSON.
            {{
              "risk_score": float,
              "summary": "string",
              "vulnerabilities": [...]
            }}"""),
            ("user", "Target: {target}\n\nRaw Output:\n{raw_output}")
        ])

        try:
            chain = prompt | self.llm
            response = await chain.ainvoke({"target": results["target"], "raw_output": results["raw_output"]})
            content = response.content
            # Basic JSON extractor
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"AI Report generation failed: {e}")
            return {"error": str(e)}

scanner_service = ScannerService()
