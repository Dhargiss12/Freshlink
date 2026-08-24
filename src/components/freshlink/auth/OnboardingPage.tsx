'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, BarChart3, Clock, Recycle, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: <BarChart3 className="size-8" />,
    title: 'Predict Demand',
    description: 'AI-powered demand forecasting helps you plan your harvest and pricing strategy.',
  },
  {
    icon: <Clock className="size-8" />,
    title: 'Sell at the Right Time',
    description: 'Smart alerts and pricing insights so you never miss the perfect selling window.',
  },
  {
    icon: <Recycle className="size-8" />,
    title: 'Reduce Food Waste',
    description: 'Connect directly with buyers to sell fresh produce before it spoils.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

export default function OnboardingPage() {
  const { navigate } = useAppStore();

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-emerald-600">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Decorative Circles */}
      <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/5" />
      <div className="absolute -bottom-32 -left-32 size-[500px] rounded-full bg-white/5" />
      <div className="absolute top-1/3 right-10 size-64 rounded-full bg-emerald-400/10" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex size-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm"
          >
            <Leaf className="size-6 text-white" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl font-bold text-white tracking-tight"
          >
            FreshLink
          </motion.span>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('login')}
            className="text-white/80 hover:text-white hover:bg-white/10 font-medium"
          >
            Skip
          </Button>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-3xl mx-auto text-center"
        >
          {/* Tagline / Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white/90">
              <Leaf className="size-3.5" />
              AI-Powered Agriculture
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight mb-4"
          >
            Sell It Before
            <br />
            It Spoils.
          </motion.h1>

          {/* Secondary Text */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-white/90 font-medium mb-2"
          >
            Better Decisions. Less Waste. A Fresher Tomorrow.
          </motion.p>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-base text-white/70 max-w-xl mx-auto mb-12"
          >
            AI-powered agricultural intelligence connecting farmers and buyers for
            a smarter, more sustainable food supply chain.
          </motion.p>

          {/* Feature Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-left border border-white/10 hover:bg-white/15 transition-colors duration-300"
              >
                <div className="flex size-14 items-center justify-center rounded-xl bg-white/15 mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate('signup')}
              className="bg-white text-green-700 hover:bg-white/90 font-semibold rounded-xl px-8 h-12 text-base shadow-lg shadow-black/10"
            >
              Get Started
              <ArrowRight className="size-4 ml-2" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('login')}
              className="text-white/90 hover:text-white hover:bg-white/10 font-medium rounded-xl px-8 h-12 text-base border border-white/20"
            >
              I already have an account
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="relative z-10 pb-6 text-center"
      >
        <p className="text-sm text-white/50 font-medium">
          Fresh Produce • Stronger Farmers • Healthier Communities
        </p>
      </motion.footer>
    </div>
  );
}
