
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
                <p>
                  By accessing and using MatchTime, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. Eligibility</h3>
                <p className="mb-2">To use MatchTime, you must:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Be at least 18 years old</li>
                  <li>Have the legal capacity to enter into this agreement</li>
                  <li>Not be prohibited from using the service under applicable law</li>
                  <li>Not have been previously banned from the service</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">3. Account Responsibilities</h3>
                <p className="mb-2">You are responsible for:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Maintaining the security of your account</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and truthful information</li>
                  <li>Keeping your profile information up to date</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">4. Prohibited Conduct</h3>
                <p className="mb-2">You may not:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Use the service for any unlawful purpose</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Post false, inaccurate, or misleading information</li>
                  <li>Upload inappropriate or offensive content</li>
                  <li>Spam or solicit other users</li>
                  <li>Use automated systems to access the service</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">5. Content Guidelines</h3>
                <p className="mb-2">All content you post must:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Be appropriate and not offensive</li>
                  <li>Not violate any third-party rights</li>
                  <li>Not contain nudity or sexually explicit material</li>
                  <li>Not promote violence or illegal activities</li>
                  <li>Be your own original content or properly licensed</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">6. Premium Services</h3>
                <p>
                  Some features require a premium subscription. Premium subscriptions are billed 
                  in advance and are non-refundable. You may cancel your subscription at any time.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">7. Privacy</h3>
                <p>
                  Your privacy is important to us. Please review our Privacy Policy, which also 
                  governs your use of the service, to understand our practices.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">8. Termination</h3>
                <p>
                  We may terminate or suspend your account immediately, without prior notice, 
                  for any reason, including if you breach the Terms of Service.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">9. Disclaimer</h3>
                <p>
                  The service is provided "as is" without any warranties. We do not guarantee 
                  that you will find a match or that the service will meet your expectations.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">10. Contact Information</h3>
                <p>
                  If you have any questions about these Terms, please contact us at 
                  legal@matchtime.com
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;
