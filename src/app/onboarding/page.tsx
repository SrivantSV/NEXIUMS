'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/database.types';

const userRoles = [
  { value: 'developer', label: 'Developer', description: 'Build and code applications' },
  { value: 'designer', label: 'Designer', description: 'Create visual designs' },
  { value: 'product_manager', label: 'Product Manager', description: 'Manage products' },
  { value: 'student', label: 'Student', description: 'Learning and education' },
  { value: 'researcher', label: 'Researcher', description: 'Research and analysis' },
  { value: 'content_creator', label: 'Content Creator', description: 'Create content' },
  { value: 'business_analyst', label: 'Business Analyst', description: 'Analyze business' },
  { value: 'other', label: 'Other', description: 'Something else' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Basic Info
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Step 2: Role Selection
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Step 3: Interests
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = async () => {
    if (step === 1) {
      // Validate username
      if (!username || username.length < 3) {
        toast.error('Username must be at least 3 characters');
        return;
      }

      // Check if username is available
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (data) {
        toast.error('Username is already taken');
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (!selectedRole) {
        toast.error('Please select a role');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('No user found');
        return;
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          username,
          display_name: displayName || username,
          user_role: selectedRole,
          skills,
          onboarding_completed: true,
          onboarding_step: 3,
        })
        .eq('id', user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Profile setup complete!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Onboarding error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Step {step} of {totalSteps}
          </CardDescription>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="johndoe"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be your unique identifier on the platform
                </p>
              </div>

              <div>
                <Label htmlFor="displayName">Display Name (Optional)</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>What best describes your role?</Label>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {userRoles.map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setSelectedRole(role.value as UserRole)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        selectedRole === role.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{role.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {role.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="skills">Add Your Skills (Optional)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="skills"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="e.g., React, Python, Design"
                    disabled={isLoading}
                  />
                  <Button type="button" onClick={addSkill} disabled={isLoading}>
                    Add
                  </Button>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {skills.map((skill) => (
                      <div
                        key={skill}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="hover:text-destructive"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className={step === 1 ? 'ml-auto' : ''}
            >
              {isLoading
                ? 'Saving...'
                : step === totalSteps
                ? 'Complete'
                : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
