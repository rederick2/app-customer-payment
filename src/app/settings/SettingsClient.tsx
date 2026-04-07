'use client';

import { useState } from 'react';
import ProfileForm from './components/ProfileForm';
import PaymentForm from './components/PaymentForm';
import TaxSettings from './components/TaxSettings';
import TeamSettings from './components/TeamSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, Percent, Users, Share2 } from 'lucide-react';
import IntegrationsSettings from './components/IntegrationsSettings';

export default function SettingsClient({
  initialProfile,
  initialTaxes,
  initialTeamMembers
}: {
  initialProfile: any,
  initialTaxes: any[],
  initialTeamMembers: any[]
}) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl  font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile, payment details, and default taxes.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Payment</span>
          </TabsTrigger>
          <TabsTrigger value="taxes" className="flex items-center space-x-2">
            <Percent className="h-4 w-4" />
            <span>Taxes</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Team Members</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Share2 className="h-4 w-4" />
            <span>Integrations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm initialData={initialProfile} />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentForm initialData={initialProfile} />
        </TabsContent>

        <TabsContent value="taxes">
          <TaxSettings initialTaxes={initialTaxes} />
        </TabsContent>

        <TabsContent value="team">
          <TeamSettings initialTeamMembers={initialTeamMembers} />
        </TabsContent>
        <TabsContent value="integrations">
          <IntegrationsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
