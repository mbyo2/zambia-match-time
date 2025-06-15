
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import AdminPanel from './AdminPanel';

const DevActions = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateUsers = async () => {
        setIsLoading(true);
        toast.info("Starting to generate 100 fake users...", {
            description: "This may take several minutes. Please don't navigate away.",
            duration: 10000,
        });

        const { error } = await supabase.functions.invoke('generate-fake-users');

        if (error) {
            toast.error("Failed to generate users.", {
                description: error.message,
            });
            console.error(error);
        } else {
            toast.success("Successfully generated 100 fake users.", {
                description: "You may need to refresh the discover page to see them.",
            });
        }

        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <AdminPanel />
            
            <Card>
                <CardHeader>
                    <CardTitle>Developer Actions</CardTitle>
                    <CardDescription>
                        For development and testing purposes only.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-4">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Heads up!</AlertTitle>
                      <AlertDescription>
                        This requires a Replicate API key to be set as a `REPLICATE_API_KEY` secret in your Supabase project settings.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Generate Fake Users</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                Creates 100 new user accounts with AI-generated Zambian profile photos.
                            </p>
                            <Button onClick={handleGenerateUsers} disabled={isLoading}>
                                {isLoading ? 'Generating...' : 'Generate 100 Users'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DevActions;
