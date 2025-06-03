import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Shield, ShoppingBag, Video, Search, Crown } from 'lucide-react';

const VerifySeller = () => {
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const plans = [
    {
      id: 'monthly',
      name: 'Monthly Premium',
      price: 199,
      duration: '1 Month',
      features: [
        'Verified seller badge',
        'Priority in search results',
        'Shoppable video feature',
        'Seller store spotlight',
        'Premium analytics',
        'Priority customer support'
      ],
      popular: false
    },
    {
      id: 'sixmonths',
      name: '6 Months Premium',
      price: 999,
      originalPrice: 1194,
      duration: '6 Months',
      features: [
        'All monthly features',
        'Save ₹195',
        'Extended analytics history',
        'Featured seller opportunities',
        'Advanced marketing tools',
        'Dedicated account manager'
      ],
      popular: true,
      savings: '16% OFF'
    }
  ];

  const handlePayment = (planId) => {
    // This would typically integrate with PayU
    console.log('Initiating PayU payment for plan:', planId);
    // PayU payment integration would go here
    alert(`Redirecting to PayU for ${planId} plan payment...`);
  };

  return (
    <div className="min-h-screen bg-newGradiant py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <Crown className="w-12 h-12 text-yellow-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Become a Premium Seller</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get the verified badge and unlock exclusive features to boost your sales and visibility
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
            <Shield className="w-10 h-10 text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Verified Badge</h3>
            <p className="text-gray-600 text-sm">Stand out with an official verification badge</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100">
            <Search className="w-10 h-10 text-green-500 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Priority Search</h3>
            <p className="text-gray-600 text-sm">Your products appear first in search results</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
            <Video className="w-10 h-10 text-purple-500 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Shoppable Videos</h3>
            <p className="text-gray-600 text-sm">Create engaging video content to sell products</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
            <ShoppingBag className="w-10 h-10 text-orange-500 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Store Spotlight</h3>
            <p className="text-gray-600 text-sm">Featured placement for your seller store</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ scale: 1.02 }}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                plan.popular ? 'ring-4 ring-purple-400' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-bl-lg">
                  <span className="text-sm font-semibold">{plan.savings}</span>
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.duration}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-800">₹{plan.price}</span>
                  {plan.originalPrice && (
                    <span className="text-lg text-gray-500 line-through ml-2">
                      ₹{plan.originalPrice}
                    </span>
                  )}
                  <span className="text-gray-600 text-sm block mt-1">per {plan.duration.toLowerCase()}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    handlePayment(plan.id);
                  }}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      : 'bg-gray-800 text-white hover:bg-gray-900'
                  }`}
                >
                  Get Started with PayU
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="bg-blue-50 rounded-xl p-6 max-w-2xl mx-auto">
            <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Why become a Premium Seller?
            </h3>
            <p className="text-gray-600">
              Premium sellers see an average of 3x more sales and 5x more visibility. 
              Join thousands of successful sellers who have transformed their business with our premium features.
            </p>
          </div>
        </motion.div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Secure payments powered by PayU. Cancel anytime.</p>
        </div>
      </div>
    </div>
  );
};

export default VerifySeller;