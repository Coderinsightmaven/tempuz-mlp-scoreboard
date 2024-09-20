import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface ResolutionInputProps {
  onResolutionChange: (width: number, height: number) => void;
}

const ResolutionInput: React.FC<ResolutionInputProps> = ({ onResolutionChange }) => {
  const form = useForm({
    defaultValues: {
      resolution: '',
    },
  });

  const onSubmit = (data: { resolution: string }) => {
    const [width, height] = data.resolution.split('x').map(Number);
    if (width && height) {
      onResolutionChange(width, height);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-background/80 backdrop-blur-sm  rounded-lg shadow-lg">
      <h1 className='text-sm'>Enter Width x Height</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-2 ">
          <FormField
            control={form.control}
            name="resolution"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Default: 384x254" 
                    className="w-36"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit">Set</Button>
        </form>
      </Form>
    </div>
  );
};

export default ResolutionInput;