
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
                <p className="mb-2">We collect information you provide directly to us, such as when you:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Create an account</li>
                  <li>Complete your profile</li>
                  <li>Upload photos or videos</li>
                  <li>Send messages to other users</li>
                  <li>Contact customer support</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. How We Use Your Information</h3>
                <p className="mb-2">We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Show you profiles of other users</li>
                  <li>Enable you to communicate with matches</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Protect against fraud and abuse</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">3. Information Sharing</h3>
                <p className="mb-2">We may share your information in the following situations:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>With other users as part of the service (profile information)</li>
                  <li>With service providers who help us operate our service</li>
                  <li>When required by law or to protect our rights</li>
                  <li>In connection with a merger or acquisition</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">4. Data Security</h3>
                <p>
                  We implement appropriate security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction. However, 
                  no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">5. Data Retention</h3>
                <p>
                  We retain your information for as long as your account is active or as needed 
                  to provide you services. You may delete your account at any time.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">6. Your Rights</h3>
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and information</li>
                  <li>Object to processing of your information</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">7. Cookies and Tracking</h3>
                <p>
                  We use cookies and similar technologies to provide and improve our service, 
                  analyze usage, and for security purposes.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">8. Changes to This Policy</h3>
                <p>
                  We may update this privacy policy from time to time. We will notify you of 
                  any changes by posting the new policy on this page.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">9. Contact Us</h3>
                <p>
                  If you have any questions about this privacy policy, please contact us at 
                  privacy@matchtime.com
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
