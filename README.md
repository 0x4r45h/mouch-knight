# Mouch Knight


Run migrations to create the database schema:
```bash
pnpx prisma migrate dev --name init
```
to reset database in dev use this 
```bash
pnpm prisma db push --force-reset
```
## Usage

1. Go to [Reown Cloud](https://cloud.reown.com) and create a new project.
2. Copy your `Project ID`
3. Rename `.env.example` to `.env` and paste your `Project ID` as the value for `NEXT_PUBLIC_PROJECT_ID`
4. Run `pnpm install` to install dependencies
5. Run `pnpm run dev` to start the development server


# Local Development

## Get contracts ABIs
Install WAGMI CLI too

Clone the contracts repo from [Mouch-Knight-Contracts](https://github.com/0x4r45h/mouch-knight-contracts) and follow its readme file to compile the contracts.    

set the path to the contracts repo using `NEXT_FOUNDRY_PROJECT_PATH` variable

then in this project run 
```bash
FOUNDRY_PROJECT_PATH='/path/to-foundry-project' wagmi generate
```

