"use client";

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart3, Shield, Users } from 'lucide-react';
import Link from 'next/link';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Survey Management System</h1>
          <div className="space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Create, Manage, and Analyze Surveys with Ease
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              A comprehensive survey management platform designed for organizations
              of all sizes. Get valuable insights from your audience with our
              powerful tools.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">Start Your Free Trial</Link>
            </Button>
          </div>
        </section>

        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">
              Key Features
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <BarChart3 className="w-12 h-12 mb-4 text-primary" />
                <h4 className="text-xl font-semibold mb-2">
                  Advanced Analytics
                </h4>
                <p className="text-muted-foreground">
                  Get deep insights with our powerful analytics dashboard.
                  Track responses in real-time and generate detailed reports.
                </p>
              </Card>
              <Card className="p-6">
                <Users className="w-12 h-12 mb-4 text-primary" />
                <h4 className="text-xl font-semibold mb-2">
                  Team Collaboration
                </h4>
                <p className="text-muted-foreground">
                  Work together with your team. Assign roles and permissions
                  to manage access effectively.
                </p>
              </Card>
              <Card className="p-6">
                <Shield className="w-12 h-12 mb-4 text-primary" />
                <h4 className="text-xl font-semibold mb-2">
                  Enterprise Security
                </h4>
                <p className="text-muted-foreground">
                  Your data is protected with enterprise-grade security.
                  End-to-end encryption and GDPR compliance.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p> 2024 Survey Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };