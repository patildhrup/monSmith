FROM ubuntu:22.04

# Avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install base dependencies
RUN apt update && apt install -y \
    git \
    wget \
    curl \
    unzip \
    nmap \
    ca-certificates \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install latest Go
RUN wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz && \
    rm go1.22.5.linux-amd64.tar.gz

# Set Go environment
ENV PATH="/usr/local/go/bin:/root/go/bin:${PATH}"
ENV GOPATH="/root/go"

# Install Go tools
RUN go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest
RUN go install github.com/tomnomnom/assetfinder@latest
RUN go install github.com/projectdiscovery/dnsx/cmd/dnsx@latest
RUN go install github.com/projectdiscovery/httpx/cmd/httpx@latest
RUN go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
RUN go install github.com/PentestPad/subzy@latest
RUN go install github.com/ffuf/ffuf/v2@latest

# Update nuclei templates
RUN /root/go/bin/nuclei -update-templates

# Install LinkFinder (Python tool)
RUN git clone https://github.com/GerbenJavado/LinkFinder.git /opt/LinkFinder && \
    pip3 install -r /opt/LinkFinder/requirements.txt

# Clone SecLists
RUN git clone https://github.com/danielmiessler/SecLists /opt/seclists

# Set working directory
WORKDIR /scanner

# Default command
CMD ["/bin/bash"]