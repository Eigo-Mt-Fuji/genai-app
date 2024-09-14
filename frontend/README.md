## Running locally

- You will need to use the environment variables
  - [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. 
  - `.env` file is all that is necessary.
  - should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

```bash
pnpm install
pnpm dev
```

- Your app template should now be running on [localhost:3000](http://localhost:3000/).
