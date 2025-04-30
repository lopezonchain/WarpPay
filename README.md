# WarpPay

[![MIT License](https://img.shields.io/badge/license-MIT-green)](#license) [![Version](https://img.shields.io/badge/version-1.0.0-blue)](#)
<div align="center">
  Your all-in-one payment Farcaster & Coinbase Miniapp
<br/><br/>
  <img
    src="https://warppay.lopezonchain.xyz/WarpPayLogo.png"
    alt="WarpPay logo"
    width="150"
    height="150"
  />
</div>


---

## 🚀 Features

- **Farcaster & Coinbase Miniapp integration**  
- **Cross-chain Multisend**: Send native coins & ERC-20 tokens in multiple EVM chains, supporting ENS names and Basenames
- **Payment Request Links**: Generate shareable links, integrated with Farcaster & Coinbase feeds but usable everywhere
- **🎁 Airdrop & Multisend**: Bulk distribution on Base network (initial release)  

## 🔧 Tech Stack

- **Frontend**: Next · React · TypeScript · Tailwind CSS  
- **Smart Contracts**: Solidity ^0.8.20 · Hardhat · OpenZeppelin  
- **Wallet Integration**: Onchainkit · wagmi · viem  
- **APIs**: 

## 🏗️ Getting Started

### Prerequisites

- Node.js v16+  
- Yarn or npm  
- A JSON-RPC endpoint URL (e.g., Base Mainnet, Ethereum, Polygon)  

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/warp-pay.git
cd warp-pay

# Install dependencies
npm install   # or yarn install

# Start the dev server
npm run dev

# Open in browser
# http://localhost:3000
```

## 📈 Usage

- **Send**: Instant transfers with ENS and Basenames support.  
- **Request**: Create & share payment links (Farcaster & Coinbase).  
- **Airdrop**: Bulk multisend on Base.  
- **Scheduled**: (Coming soon) One-time & recurring payments.  

## 🤝 Contributing

We ❤️ contributions! Please follow these steps:

1. Fork the repo  
2. Create a branch:  
   ```bash
   git checkout -b feature/your-feature
   ```  
3. Commit your changes:  
   ```bash
   git commit -m "Add awesome feature"
   ```  
4. Push to branch:  
   ```bash
   git push origin feature/your-feature
   ```  
5. Open a Pull Request  

Feel free to open issues for bugs, feature requests, or general feedback.

## 📜 License

Distributed under the MIT License.  
See [LICENSE](LICENSE) for details.

## Created using MiniKit Template

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-onchain --mini`](), configured with:

- [MiniKit](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit](https://www.base.org/builders/onchainkit)
- [Tailwind CSS](https://tailwindcss.com)
- [Next.js](https://nextjs.org/docs)
