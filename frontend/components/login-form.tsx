'use client'

import { Authenticator } from '@aws-amplify/ui-react';

export default function LoginForm() {

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <h1>Hello {user?.userId}</h1>
          <button onClick={signOut}>Sign out</button>
        </main>
      )}
    </Authenticator>
  )
}
