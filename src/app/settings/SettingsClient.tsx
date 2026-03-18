'use client';

import { useState } from 'react';
import ProfileForm from './components/ProfileForm';
import PaymentForm from './components/PaymentForm';
import TaxSettings from './components/TaxSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, Percent } from 'lucide-react';

export default function SettingsClient({ initialProfile, initialTaxes }: { initialProfile: any, initialTaxes: any[] }) {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile, payment details, and default taxes.</p>
      </div>

      <Tabs className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger 
            value="profile" 
            data-state={activeTab === 'profile' ? 'active' : 'inactive'}
            onClick={() => setActiveTab('profile')}
            className="flex items-center space-x-2"
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payment" 
            data-state={activeTab === 'payment' ? 'active' : 'inactive'}
            onClick={() => setActiveTab('payment')}
            className="flex items-center space-x-2"
          >
            <CreditCard className="h-4 w-4" />
            <span>Payment</span>
          </TabsTrigger>
          <TabsTrigger 
            value="taxes" 
            data-state={activeTab === 'taxes' ? 'active' : 'inactive'}
            onClick={() => setActiveTab('taxes')}
            className="flex items-center space-x-2"
          >
            <Percent className="h-4 w-4" />
            <span>Taxes</span>
          </TabsTrigger>
        </TabsList>

        {activeTab === 'profile' && (
          <TabsContent value="profile">
            <ProfileForm initialData={initialProfile} />
          </TabsContent>
        )}

        {activeTab === 'payment' && (
          <TabsContent value="payment">
            <PaymentForm initialData={initialProfile} />
          </TabsContent>
        )}

        {activeTab === 'taxes' && (
          <TabsContent value="taxes">
            <TaxSettings initialTaxes={initialTaxes} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
