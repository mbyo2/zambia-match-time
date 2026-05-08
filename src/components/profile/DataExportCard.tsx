import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DataExportCard: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('export_user_data');
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matchtime-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Your data has been downloaded.');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 pt-6">
        <div className="flex items-center gap-4">
          <Download className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-medium">Download my data</h3>
            <p className="text-sm text-muted-foreground">Get a JSON copy of your profile, matches, messages and more (GDPR).</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={download} disabled={loading}>
          {loading ? 'Preparing…' : 'Download'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DataExportCard;