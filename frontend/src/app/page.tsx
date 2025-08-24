'use client';

import Link from 'next/link';
import { 
  TrendingUp, 
  Brain, 
  Shield, 
  Zap, 
  BarChart3, 
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">AI Trading System</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-white hover:text-blue-400 px-4 py-2 rounded-md transition-colors">
                About
              </button>
              <button className="text-white hover:text-blue-400 px-4 py-2 rounded-md transition-colors">
                Features
              </button>
              <button className="border border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white px-4 py-2 rounded-md transition-colors">
                Sign In
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                Get Started
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            AI-Powered
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {" "}Trading{" "}
            </span>
            Revolution
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Harness the power of artificial intelligence to make smarter trading decisions. 
            Our advanced algorithms analyze market patterns, predict trends, and execute trades 
            with precision and speed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-md flex items-center justify-center transition-colors">
                Start Trading Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </Link>
            <button className="border border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg rounded-md transition-colors">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Why Choose Our AI Trading System?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
              <Brain className="h-12 w-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">AI-Powered Insights</h3>
              <p className="text-gray-300">
                Advanced machine learning algorithms analyze market data to provide intelligent trading recommendations.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
              <Zap className="h-12 w-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
              <p className="text-gray-300">
                Execute trades in milliseconds with our high-performance infrastructure and real-time market data.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
              <Shield className="h-12 w-12 text-green-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Risk Management</h3>
              <p className="text-gray-300">
                Built-in risk assessment and management tools to protect your investments and maximize returns.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
              <BarChart3 className="h-12 w-12 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-300">
                Comprehensive portfolio analytics and performance tracking with detailed reports and insights.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
              <Users className="h-12 w-12 text-pink-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Expert Support</h3>
              <p className="text-gray-300">
                24/7 support from our team of trading experts and AI specialists to help you succeed.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
              <CheckCircle className="h-12 w-12 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Proven Results</h3>
              <p className="text-gray-300">
                Join thousands of successful traders who have improved their returns with our AI system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">99.9%</div>
              <div className="text-gray-300">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">$2.5B+</div>
              <div className="text-gray-300">Assets Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">50K+</div>
              <div className="text-gray-300">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">15%</div>
              <div className="text-gray-300">Avg. Annual Return</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the AI trading revolution and start making smarter investment decisions today.
          </p>
          <Link href="/dashboard">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-md transition-colors">
              Get Started Free
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <TrendingUp className="h-6 w-6 text-blue-400" />
              <span className="text-lg font-semibold text-white">AI Trading System</span>
            </div>
            <div className="flex space-x-6 text-gray-400">
              <Link href="#" className="hover:text-white">Privacy Policy</Link>
              <Link href="#" className="hover:text-white">Terms of Service</Link>
              <Link href="#" className="hover:text-white">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}