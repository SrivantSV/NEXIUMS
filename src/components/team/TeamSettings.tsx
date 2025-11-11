'use client';

import { useState } from 'react';
import { TeamWorkspace } from '@/types/collaboration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface TeamSettingsProps {
  workspace: TeamWorkspace;
  onUpdate: (settings: any) => void;
}

export function TeamSettings({ workspace, onUpdate }: TeamSettingsProps) {
  const [settings, setSettings] = useState(workspace.settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(settings);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold">Workspace Settings</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your workspace configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic workspace configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Member Invites</Label>
              <div className="text-sm text-muted-foreground">
                Let members invite others to the workspace
              </div>
            </div>
            <Switch
              checked={settings.allowMemberInvites}
              onCheckedChange={(checked) =>
                updateSetting('allowMemberInvites', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Email Verification</Label>
              <div className="text-sm text-muted-foreground">
                New members must verify their email
              </div>
            </div>
            <Switch
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) =>
                updateSetting('requireEmailVerification', checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable External Sharing</Label>
              <div className="text-sm text-muted-foreground">
                Allow sharing resources outside the workspace
              </div>
            </div>
            <Switch
              checked={settings.enableExternalSharing}
              onCheckedChange={(checked) =>
                updateSetting('enableExternalSharing', checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
