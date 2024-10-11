import React, { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface EventIdInputProps {
  onEventIdChange: (eventId: string) => void;
  initialEventId: string;
}

const EventIdInput: React.FC<EventIdInputProps> = ({ onEventIdChange, initialEventId }) => {
  const form = useForm({
    defaultValues: {
      eventId: initialEventId,
    },
  });

  useEffect(() => {
    // Update form value when initialEventId changes
    form.setValue("eventId", initialEventId);
  }, [initialEventId, form]);

  const onSubmit = (data: { eventId: string }) => {
    onEventIdChange(data.eventId);
  };

  return (
    <div className="p-4 bg-background/80 backdrop-blur-sm rounded-lg shadow-lg">
      <h1 className='text-sm'>Enter Event ID</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-2">
          <FormField
            control={form.control}
            name="eventId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="e.g., 2024 MLP7" 
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

export default EventIdInput;
