import { Amplify } from "aws-amplify"
import outputs from "../amplify_outputs.json"
import '@aws-amplify/ui-react/styles.css';
import { ImageUploadForm } from '@/components/image-upload-form'

// https://docs.amplify.aws/react/start/connect-to-aws-resources/
Amplify.configure(outputs)

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <h1 className="text-lg font-semibold">
      Genai-app&nbsp;
      </h1>
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <ImageUploadForm />
      </div>
    </div>
  )

}
