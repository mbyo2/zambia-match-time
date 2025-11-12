
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import AdminPanel from './AdminPanel';
import AdminDashboard from './AdminDashboard';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';

const DevActions = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isBackfilling, setIsBackfilling] = useState(false);
    const { isSuperAdmin, loading } = useSuperAdmin();

    if (loading) return null;

    if (!isSuperAdmin) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You do not have permission to view this page.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

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
        } else {
            toast.success("Successfully generated 100 fake users.", {
                description: "You may need to refresh the discover page to see them.",
            });
        }

        setIsLoading(false);
    };

    const handleBackfillPhotos = async () => {
        setIsBackfilling(true);
        toast.info('Starting photo backfill...', {
            description: 'Adding curated photos to accounts missing photos.',
            duration: 8000,
        });

        const { data, error } = await supabase.functions.invoke('backfill-profile-photos', {
            body: { limit: 200 }
        });

        if (error) {
            toast.error('Backfill failed.', { description: error.message });
        } else {
            toast.success('Photo backfill complete.', {
                description: `Added: ${data?.added ?? 0}, skipped: ${data?.skipped ?? 0}, failed: ${data?.failed ?? 0}`,
            });
        }

        setIsBackfilling(false);
    };

    return (
        <div className="space-y-6">
            <AdminDashboard />
            <AdminPanel />
            
            <Card>
                <CardHeader>
                    <CardTitle>Developer Actions</CardTitle>
                    <CardDescription>
                        For development and testing purposes only.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Generate Fake Users</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                Creates 100 new user accounts with curated stock profile photos.
                            </p>
                            <Button onClick={handleGenerateUsers} disabled={isLoading}>
                                {isLoading ? 'Generating...' : 'Generate 100 Users'}
                            </Button>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Backfill Profile Photos</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                Adds curated photos to existing accounts missing photos.
                            </p>
                            <Button onClick={handleBackfillPhotos} disabled={isBackfilling}>
                                {isBackfilling ? 'Backfilling...' : 'Backfill Photos'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DevActions;
