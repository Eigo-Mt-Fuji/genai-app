"use client";

import { Amplify } from "aws-amplify"
import { Authenticator } from '@aws-amplify/ui-react';
import outputs from "../../amplify_outputs.json"
import '@aws-amplify/ui-react/styles.css';
import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';

// https://docs.amplify.aws/react/start/connect-to-aws-resources/
Amplify.configure(outputs)

export default function Home() {
  const [file, setFile] = useState();

  const handleChange = (event: any) => {
    setFile(event.target.files[0]);
  };    
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Genai-app&nbsp;
        </p>
        <div>
          <input type="file" onChange={handleChange} />
            <button
              onClick={() =>
                uploadData({
                  path: `picture-submissions/${file.name}`,
                  data: file,
              })
            }>Upload
          </button>
        </div>

      </div>
        <Authenticator>
        {({ signOut, user }) => (
          <main>
            <h1>Hello {user?.userId}</h1>
            <button onClick={signOut}>Sign out</button>
          </main>
        )}
      </Authenticator>

    </main>
  );
}
