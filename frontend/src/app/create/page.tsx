'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import {
  ArrowLeft,
  Coins,
  Users,
  Calendar,
  DollarSign,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useMonaDAO } from '@/hooks/useContracts';

export default function CreateDAOPage() {
  const [step, setStep] = useState(1);
  const { createTask, isPending } = useMonaDAO();
  const [formData, setFormData] = useState({
    // DAO Info
    name: '',
    description: '',
    category: '',
    tokenName: '',
    tokenSymbol: '',
    initialSupply: '',

    // Challenge Settings
    challengeTitle: '',
    challengeDescription: '',
    duration: '',
    entryFee: '',
    maxParticipants: '',
    successCriteria: '',
  });

  const categories = [
    'Health & Fitness',
    'Education',
    'Technology',
    'Business',
    'Art & Creativity',
    'Social Impact',
  ];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleCreateChallenge = async () => {
    if (
      !formData.challengeTitle ||
      !formData.challengeDescription ||
      !formData.entryFee ||
      !formData.maxParticipants ||
      !formData.duration
    ) {
      return;
    }

    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + parseInt(formData.duration));

      await createTask(
        formData.challengeTitle,
        formData.challengeDescription,
        formData.entryFee,
        parseInt(formData.maxParticipants),
        deadline
      );
    } catch (error) {
      console.error('Failed to create challenge:', error);
    }
  };

  const backgroundStyle = {};

  return (
    <div className="bg-background min-h-screen" style={backgroundStyle}>
      <Navbar />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-foreground mb-4 text-4xl font-bold">
              Create New DAO
            </h1>
            <p className="text-muted-foreground text-lg">
              Set up your challenge-based DAO
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(stepNum => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    stepNum <= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 3 && <div className="bg-border mx-2 h-px w-8" />}
              </div>
            ))}
          </div>

          {/* Step 1: DAO Information */}
          {step === 1 && (
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  DAO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">DAO Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. FitDAO, DevDAO"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <Badge
                          key={cat}
                          variant={
                            formData.category === cat ? 'default' : 'secondary'
                          }
                          className="cursor-pointer"
                          onClick={() =>
                            setFormData({ ...formData, category: cat })
                          }
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your DAO's mission and goals..."
                    value={formData.description}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} disabled={!formData.name}>
                    Next: First Challenge
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: First Challenge */}
          {step === 2 && (
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Create Your First Challenge
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="challengeTitle">Challenge Title</Label>
                  <Input
                    id="challengeTitle"
                    placeholder="e.g. 30-Day Fitness Challenge"
                    value={formData.challengeTitle}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        challengeTitle: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challengeDescription">
                    Challenge Description
                  </Label>
                  <Textarea
                    id="challengeDescription"
                    placeholder="Detailed rules, requirements, and success criteria..."
                    value={formData.challengeDescription}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        challengeDescription: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="30"
                      value={formData.duration}
                      onChange={e =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entryFee">Entry Fee (USDT)</Label>
                    <Input
                      id="entryFee"
                      type="number"
                      placeholder="100"
                      value={formData.entryFee}
                      onChange={e =>
                        setFormData({ ...formData, entryFee: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      placeholder="100"
                      value={formData.maxParticipants}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          maxParticipants: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!formData.challengeTitle || !formData.entryFee}
                  >
                    Next: Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review & Deploy */}
          {step === 3 && (
            <Card className="border-border bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Review & Deploy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* DAO Summary */}
                <div className="space-y-4">
                  <h3 className="text-foreground font-medium">
                    DAO Information
                  </h3>
                  <div className="bg-muted space-y-2 rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="secondary">{formData.category}</Badge>
                    </div>
                  </div>
                </div>

                {/* Challenge Summary */}
                <div className="space-y-4">
                  <h3 className="text-foreground font-medium">
                    First Challenge
                  </h3>
                  <div className="bg-muted space-y-2 rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Title:</span>
                      <span className="font-medium">
                        {formData.challengeTitle}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {formData.duration} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Entry Fee:</span>
                      <span className="font-medium">
                        ${formData.entryFee} USDT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Max Participants:
                      </span>
                      <span className="font-medium">
                        {formData.maxParticipants}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button onClick={handleCreateChallenge} disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Challenge'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
