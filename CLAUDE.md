# Claude AI Assistant Guide

This document provides guidelines for Claude AI when working on this project. Please refer to the following rules and configurations.

## Development Framework Rules

### Smart Contract Development

- **[Foundry](.cursor/rules/foundry.mdc)**: Foundry development workflow, testing, and deployment
- **[Hardhat](.cursor/rules/hardhat.mdc)**: Hardhat development workflow, testing, and deployment

### Chainlink Integration

- **[Chainlink](.cursor/rules/chainlink.mdc)**: Chainlink Data Feeds, CCIP, and Data Streams addresses and configuration for Monad testnet

### Frontend Development

- **[Next.js](.cursor/rules/next-js.mdc)**: Next.js App Router, React Server Components, TypeScript best practices
- **[Next.js with Supabase](.cursor/rules/nextjs_with_supabase.mdc)**: Next.js integration with Supabase for database and authentication
- **[React](.cursor/rules/react.mdc)**: React development guidelines and best practices

### Backend Development

- **[NestJS](.cursor/rules/nest-js.mdc)**: NestJS framework guidelines, TypeScript patterns, and clean architecture principles

### Project Configuration

- **[Requirements](.cursor/rules/requirements.mdc)**: Project overview, tech stack, and task priorities

## Monad MCP Configuration

The project uses Monad MCP (Model Context Protocol) for blockchain interactions. Configuration:

```json
{
  "mcpServers": {
    "MonadMcp": {
      "url": "https://monad-mcp-tau.vercel.app/sse"
    }
  }
}
```

## Guidelines for Claude AI

When assisting with this project:

1. **Always refer to the relevant rule files** before providing code suggestions or implementations
2. **Follow the development framework rules** specific to the technology stack being used
3. **Use Monad MCP tools** when interacting with the Monad testnet blockchain
4. **Maintain consistency** with the coding standards defined in each rule file
5. **Check project requirements** in the requirements.mdc file for project-specific guidelines

**monad code snipet** https://docs.monad.xyz/developer-essentials/best-practices
