# Mouch Knight

# ON PRODUCTION USE THIS
```bash
pnpx prisma migrate deploy
```

# ON DEV only
Create a migration from changes in Prisma schema, apply it to the database
```bash
pnpx prisma migrate dev --name init
```
to drop everything and migrate from scratch in dev

```bash
pnpx prisma migrate reset
```

to reset database in dev use this 
```bash
pnpm prisma db push --force-reset
```

If you manually changed something like a column name in migration file and models and don't want to write a new migration use this. this will regenrate the prisma client. it is located in `/node_modules/@prisma/client` so you wont see this in git
```bash
pnpx prisma generate
```

## Usage

1. Go to [Reown Cloud](https://cloud.reown.com) and create a new project.
2. Copy your `Project ID`
3. Rename `.env.example` to `.env` and paste your `Project ID` as the value for `NEXT_PUBLIC_PROJECT_ID`
4. Run `pnpm install` to install dependencies
5. Run `pnpm run dev` to start the development server


# Local Development
# wasm

Setup Instructions
Set up the Rust/WASM environment:
First, make sure you have Rust and wasm-pack installed:

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install wasm-pack
Copy
Insert

Create the WASM module directory structure:
mkdir -p wasm/src
Copy
Insert

Place the Rust code in /wasm/src/lib.rs and the Cargo.toml in /wasm/Cargo.toml
Build the WASM module:
cd wasm
wasm-pack build --target web

## Farcaster Dev
i use cloudflared on my server to quickly expose it to the internet and run the app on pnpm run dev, so i can push my changes to server using rsync and get instant results on warpcast

## Get contracts ABIs
Install WAGMI CLI too

Clone the contracts repo from [Mouch-Knight-Contracts](https://github.com/0x4r45h/mouch-knight-contracts) and follow its readme file to compile the contracts.    

set the path to the contracts repo using `NEXT_FOUNDRY_PROJECT_PATH` variable

then in this project run 
```bash
FOUNDRY_PROJECT_PATH='/path/to-foundry-project' wagmi generate
```

