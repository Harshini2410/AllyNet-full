import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Heart, Users, MapPin, Lock, AlertTriangle, ArrowLeft, CheckCircle2, Award } from 'lucide-react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import AppShell from '../../layouts/AppShell';

/**
 * AboutAllyNet - Full-page About experience
 * Story-driven explanation of AllyNet's mission, features, and responsible usage
 */
const AboutAllyNet = () => {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6 },
    },
  };

  // Developers in alphabetical order
  const developers = [
    'Chakrish Vejandla',
    'Harshini Nadendla',
    'Spurthi Inturu',
    'Sriman Cheeti'
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-sand-100 dark:bg-charcoal-900 pb-24">
        {/* Header with back button */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-sand-100/80 dark:bg-charcoal-900/80 backdrop-blur-md px-6 py-4 flex items-center gap-4"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white dark:bg-charcoal-800 border border-sand-200 dark:border-charcoal-700 hover:bg-sand-50 dark:hover:bg-charcoal-700 transition-colors"
          >
            <ArrowLeft size={20} className="text-charcoal-500 dark:text-sand-50" />
          </motion.button>
          <h1 className="text-xl font-bold text-charcoal-500 dark:text-sand-50">About AllyNet</h1>
        </motion.header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-6 py-8 space-y-8"
        >
          {/* Hero Section */}
          <motion.section variants={itemVariants}>
            <Card className="bg-gradient-to-br from-sage-50 to-white dark:from-charcoal-800 dark:to-charcoal-800 border-sage-100 dark:border-charcoal-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-sage-100 dark:bg-sage-900/40 rounded-2xl">
                  <Shield size={28} className="text-sage-600 dark:text-sage-400" />
                </div>
                <h2 className="text-2xl font-bold text-charcoal-500 dark:text-sand-50">What is AllyNet?</h2>
              </div>
              <p className="text-base text-charcoal-400 dark:text-sand-300 leading-relaxed mb-4">
                AllyNet is a safety-first network built on mutual trust. We combine real-time emergency response 
                with daily community assistance to ensure no one in our neighborhood feels alone.
              </p>
              <p className="text-sm text-charcoal-300 dark:text-sand-400 leading-relaxed">
                Our mission is simple: create a connected community where neighbors help neighbors, 
                emergencies get immediate attention, and everyone feels safe and supported.
              </p>
            </Card>
          </motion.section>

          {/* Problem Statement */}
          <motion.section variants={itemVariants}>
            <Card>
              <h3 className="text-lg font-bold text-charcoal-500 dark:text-sand-50 mb-3">The Problem We Solve</h3>
              <div className="space-y-3 text-sm text-charcoal-400 dark:text-sand-300 leading-relaxed">
                <p>
                  In today's world, emergencies can happen anywhere, anytime. Traditional emergency services 
                  are essential, but sometimes you need immediate help from someone nearby—someone who can 
                  respond in seconds, not minutes.
                </p>
                <p>
                  At the same time, many people want to help their neighbors but don't know how or when. 
                  AllyNet bridges this gap by connecting those who need help with those who can provide it, 
                  all while maintaining the highest standards of safety and trust.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Core Pillars */}
          <motion.section variants={itemVariants}>
            <h3 className="text-xl font-bold text-charcoal-500 dark:text-sand-50 mb-4">Our Core Pillars</h3>
            <div className="space-y-4">
              {/* SOS Pillar */}
              <Card className="border-l-4 border-l-coral-500">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-coral-50 dark:bg-coral-900/20 rounded-xl">
                    <Shield size={24} className="text-coral-600 dark:text-coral-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-charcoal-500 dark:text-sand-50 mb-2">Emergency SOS</h4>
                    <p className="text-sm text-charcoal-400 dark:text-sand-300 leading-relaxed">
                      Instant location-based emergency alerts that notify nearby verified helpers and emergency services.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Community Help Pillar */}
              <Card className="border-l-4 border-l-amber-500">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <Heart size={24} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-charcoal-500 dark:text-sand-50 mb-2">Community Help</h4>
                    <p className="text-sm text-charcoal-400 dark:text-sand-300 leading-relaxed">
                      A peer-to-peer marketplace for non-urgent assistance—from moving furniture to walking pets.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Trust Pillar */}
              <Card className="border-l-4 border-l-sage-500">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-sage-50 dark:bg-sage-900/20 rounded-xl">
                    <Users size={24} className="text-sage-600 dark:text-sage-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-charcoal-500 dark:text-sand-50 mb-2">Verified Trust</h4>
                    <p className="text-sm text-charcoal-400 dark:text-sand-300 leading-relaxed">
                      Every community member is verified. Trust scores and ratings ensure safe, reliable interactions.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.section>

          {/* Feature-by-Feature Explanation */}
          <motion.section variants={itemVariants}>
            <h3 className="text-xl font-bold text-charcoal-500 dark:text-sand-50 mb-4">How It Works</h3>
            <div className="space-y-6">
              {/* SOS Feature */}
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-coral-50 dark:bg-coral-900/20 rounded-xl">
                    <Shield size={20} className="text-coral-600 dark:text-coral-400" />
                  </div>
                  <h4 className="text-lg font-bold text-charcoal-500 dark:text-sand-50">Emergency SOS</h4>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <h5 className="font-semibold text-charcoal-500 dark:text-sand-50 mb-1">What it does:</h5>
                    <p className="text-charcoal-400 dark:text-sand-300 leading-relaxed">
                      When you trigger an SOS, your location is immediately shared with nearby verified helpers 
                      and emergency services. Helpers receive real-time notifications and can respond instantly.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-charcoal-500 dark:text-sand-50 mb-1">How it's used:</h5>
                    <p className="text-charcoal-400 dark:text-sand-300 leading-relaxed">
                      Tap the SOS button, select your emergency type, and confirm. Your location is automatically 
                      detected and shared. Helpers nearby will be notified and can accept to help. You can chat 
                      with helpers in real-time and share your exact location.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-charcoal-500 dark:text-sand-50 mb-1">Security benefits:</h5>
                    <ul className="space-y-1 text-charcoal-400 dark:text-sand-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>Only verified helpers can see your emergency</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>Anonymous mode available to protect your identity</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>Location shared only during active emergencies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>All interactions are logged for safety</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        <strong>Responsible usage:</strong> SOS is for genuine emergencies only. Misuse may result 
                        in account suspension. Always call 100/108 for life-threatening situations. AllyNet complements, 
                        but does not replace, professional emergency services.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Community Help Feature */}
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <Heart size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="text-lg font-bold text-charcoal-500 dark:text-sand-50">Community Help</h4>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <h5 className="font-semibold text-charcoal-500 dark:text-sand-50 mb-1">What it does:</h5>
                    <p className="text-charcoal-400 dark:text-sand-300 leading-relaxed">
                      A marketplace where community members can request or offer non-urgent help. From simple tasks 
                      like pet sitting to more complex needs like moving assistance.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-charcoal-500 dark:text-sand-50 mb-1">How it's used:</h5>
                    <p className="text-charcoal-400 dark:text-sand-300 leading-relaxed">
                      Post a help request with details and location. Verified helpers in your area can see your 
                      request and offer assistance. You can review helper profiles, trust scores, and ratings before 
                      accepting help.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-charcoal-500 dark:text-sand-50 mb-1">Security benefits:</h5>
                    <ul className="space-y-1 text-charcoal-400 dark:text-sand-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>All helpers are verified community members</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>Trust scores and ratings help you choose reliable helpers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>Safe payment system with dispute resolution</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>Report and block features for safety</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        <strong>Responsible usage:</strong> Be respectful and fair in your requests. Complete tasks 
                        as agreed and provide honest feedback. Report any suspicious behavior immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Location-Based Discovery Feature */}
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-sage-50 dark:bg-sage-900/20 rounded-xl">
                    <MapPin size={20} className="text-sage-600 dark:text-sage-400" />
                  </div>
                  <h4 className="text-lg font-bold text-charcoal-500 dark:text-sand-50">Location-Based Discovery</h4>
                </div>
                <div className="space-y-4 text-sm">
                  <div>
                    <h5 className="font-semibold text-charcoal-500 dark:text-sand-50 mb-1">What it does:</h5>
                    <p className="text-charcoal-400 dark:text-sand-300 leading-relaxed">
                      Uses your location to find nearby emergencies and help requests. Ensures you only see relevant 
                      opportunities in your immediate area.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-charcoal-500 dark:text-sand-50 mb-1">How it's used:</h5>
                    <p className="text-charcoal-400 dark:text-sand-300 leading-relaxed">
                      Location is accessed via your device's GPS (with your permission). During active emergencies, 
                      location updates every 30 seconds to keep helpers informed. You can adjust your search radius 
                      to control how far you're willing to help.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-charcoal-500 dark:text-sand-50 mb-1">Security benefits:</h5>
                    <ul className="space-y-1 text-charcoal-400 dark:text-sand-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>Location only shared during active emergencies or when you accept a help request</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>You control when location is shared</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>Location data is encrypted and stored securely</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                        <span>No continuous tracking—only when needed</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                        <strong>Responsible usage:</strong> Only share location when necessary. Be mindful of your 
                        privacy settings and review location permissions regularly.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.section>

          {/* Trust Score System */}
          <motion.section variants={itemVariants}>
            <Card className="bg-gradient-to-br from-sage-50 to-white dark:from-charcoal-800 dark:to-charcoal-800 border-sage-200 dark:border-charcoal-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-sage-100 dark:bg-sage-900/40 rounded-xl">
                  <Award size={24} className="text-sage-600 dark:text-sage-400" />
                </div>
                <h3 className="text-xl font-bold text-charcoal-500 dark:text-sand-50">Trust Score System</h3>
              </div>
              <div className="space-y-3 text-sm text-charcoal-400 dark:text-sand-300 leading-relaxed">
                <p>
                  Our Trust Score is a community-driven reputation system that reflects your reliability and helpfulness 
                  within the AllyNet network. It's built on real interactions and verified assistance, helping community 
                  members identify reliable helpers.
                </p>
                <div className="space-y-3 mt-4">
                  <div className="p-3 bg-white dark:bg-charcoal-700 rounded-lg border border-sage-200 dark:border-charcoal-600">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={18} className="text-sage-500 shrink-0" />
                      <span className="font-semibold text-charcoal-500 dark:text-sand-50">Help Accepted: +10 points</span>
                    </div>
                    <p className="text-xs text-charcoal-400 dark:text-sand-400 ml-7">
                      When your help request response is accepted by the creator
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-charcoal-700 rounded-lg border border-sage-200 dark:border-charcoal-600">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={18} className="text-coral-500 shrink-0" />
                      <span className="font-semibold text-charcoal-500 dark:text-sand-50">Emergency Assistance: +50 points</span>
                    </div>
                    <p className="text-xs text-charcoal-400 dark:text-sand-400 ml-7">
                      When you help resolve an emergency (SOS)
                    </p>
                  </div>
                  <div className="p-3 bg-white dark:bg-charcoal-700 rounded-lg border border-charcoal-200 dark:border-charcoal-600">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={18} className="text-coral-500 shrink-0" />
                      <span className="font-semibold text-charcoal-500 dark:text-sand-50">Reported Behavior: -50 points</span>
                    </div>
                    <p className="text-xs text-charcoal-400 dark:text-sand-400 ml-7">
                      If you're reported for inappropriate behavior
                    </p>
                  </div>
                </div>
                <p className="text-xs text-charcoal-300 dark:text-sand-400 mt-4 italic">
                  Trust scores help build a safer, more trustworthy network where reliable community members are recognized 
                  and valued for their contributions.
                </p>
              </div>
            </Card>
          </motion.section>

          {/* Safety & Privacy */}
          <motion.section variants={itemVariants}>
            <Card className="bg-gradient-to-br from-sage-50 to-white dark:from-charcoal-800 dark:to-charcoal-800 border-sage-200 dark:border-charcoal-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-sage-100 dark:bg-sage-900/40 rounded-xl">
                  <Lock size={24} className="text-sage-600 dark:text-sage-400" />
                </div>
                <h3 className="text-xl font-bold text-charcoal-500 dark:text-sand-50">Safety & Privacy</h3>
              </div>
              <div className="space-y-3 text-sm text-charcoal-400 dark:text-sand-300 leading-relaxed">
                <p>
                  Your safety and privacy are our top priorities. We use industry-standard encryption to protect 
                  your data, and we never share your personal information without your explicit consent.
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                    <span>All users are verified before they can help</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                    <span>Trust scores and ratings help identify reliable community members</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                    <span>Anonymous mode available for sensitive situations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                    <span>Report and block features for immediate safety concerns</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-sage-500 mt-0.5 shrink-0" />
                    <span>Location data is only shared when you explicitly trigger an SOS or accept help</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.section>

          {/* Friendly Usage Warning */}
          <motion.section variants={itemVariants}>
            <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-2">Important Reminders</h3>
                  <div className="space-y-2 text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                    <p>
                      <strong>For emergencies:</strong> AllyNet is designed to complement, not replace, professional 
                      emergency services. Always call 100/108 for life-threatening situations.
                    </p>
                    <p>
                      <strong>For helpers:</strong> Only respond to emergencies if you can safely do so. Your safety 
                      comes first. Never put yourself in danger to help others.
                    </p>
                    <p>
                      <strong>For everyone:</strong> Use AllyNet responsibly. Misuse, false reports, or harassment 
                      will result in immediate account suspension.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.section>

          {/* Developers Section */}
          <motion.section variants={itemVariants}>
            <Card className="bg-gradient-to-br from-charcoal-50 to-sand-100 dark:from-charcoal-800 dark:to-charcoal-700 border-charcoal-200 dark:border-charcoal-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 rounded-xl">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-bold text-charcoal-500 dark:text-sand-50">Developed By</h3>
              </div>
              <p className="text-sm text-charcoal-400 dark:text-sand-400 mb-4">
                AllyNet is brought to you by a dedicated team of developers committed to building safer, more connected communities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {developers.map((developer, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white dark:bg-charcoal-800 rounded-lg border border-sand-200 dark:border-charcoal-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center shrink-0">
                        <span className="text-sage-600 dark:text-sage-400 font-semibold text-sm">
                          {developer.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <p className="font-medium text-charcoal-500 dark:text-sand-50">{developer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.section>

          {/* Call to Action */}
          <motion.section variants={itemVariants}>
            <Card className="bg-gradient-to-br from-sage-100 to-sage-50 dark:from-charcoal-800 dark:to-charcoal-800 border-sage-200 dark:border-charcoal-700 text-center">
              <h3 className="text-xl font-bold text-charcoal-500 dark:text-sand-50 mb-3">
                Ready to Build a Safer Community?
              </h3>
              <p className="text-sm text-charcoal-400 dark:text-sand-300 mb-6 leading-relaxed">
                Join thousands of neighbors who are making their communities safer, one connection at a time.
              </p>
              <div className="flex justify-center">
                <Button
                  variant="primary"
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto"
                >
                  Get Started
                </Button>
              </div>
            </Card>
          </motion.section>
        </motion.div>
      </div>
    </AppShell>
  );
};

export default AboutAllyNet;
