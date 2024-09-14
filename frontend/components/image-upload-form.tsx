import { useState } from 'react';
import { uploadData } from 'aws-amplify/storage';
import { Button } from '@/components/ui/button'

export function ImageUploadForm() {
    const [file, setFile] = useState();
  
    const handleChange = (event: any) => {
      setFile(event.target.files[0]);
    };
  
    return (
        <div className="mx-auto max-w-2xl px-4">
            <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
                <input type="file" onChange={handleChange} />
                <Button onClick={() => uploadData({path: `data/${file.name}`,data: file}) }>Upload</Button>
            </div>
        </div>
    );
}