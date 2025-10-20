import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import BackButton from '../components/ui/BackButton';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement actual form submission to backend
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton />

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
        <p className="text-xl text-slate-600">
          Have questions or need support? We're here to help!
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Form */}
        <Card>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>

          {submitted && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Thank you! Your message has been received. We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="What is this regarding?"
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us more about your inquiry..."
                rows="6"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <Button type="submit" className="w-full">
              Send Message
            </Button>
          </form>
        </Card>

        {/* Contact Information */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  📧
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Email</h3>
                  <a
                    href="mailto:support@engageswap.in"
                    className="text-teal-600 hover:underline"
                  >
                    support@engageswap.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  🌐
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Website</h3>
                  <p className="text-slate-600 text-sm">
                    <a href="https://engageswap.in" className="text-teal-600 hover:underline">
                      www.engageswap.in
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                  ⏰
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Business Hours</h3>
                  <p className="text-slate-600 text-sm">
                    Monday - Friday: 9:00 AM - 6:00 PM IST<br />
                    Saturday: 10:00 AM - 4:00 PM IST<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Need Quick Answers?</h3>
            <p className="text-slate-700 text-sm mb-4">
              Check out our FAQ section for instant answers to common questions.
            </p>
            <a
              href="/faq"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              View FAQ
            </a>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3">For Support Issues</h3>
            <p className="text-slate-700 text-sm mb-4">
              If you're facing technical issues or need help with your account, visit our support center.
            </p>
            <a
              href="/support"
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors"
            >
              Get Support
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
