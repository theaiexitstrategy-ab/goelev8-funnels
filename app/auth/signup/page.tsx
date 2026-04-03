'use client';
// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'launch',
    name: 'Launch',
    monthlyPrice: 47,
    features: [
      '1 AI Funnel Page',
      'AI Copywriting',
      'Custom Domain',
      'Lead Capture',
      'Email Support',
    ],
  },
  {
    id: 'grow',
    name: 'Grow',
    monthlyPrice: 97,
    features: [
      '5 AI Funnel Pages',
      'AI Copywriting + A/B Testing',
      'Custom Domain',
      'CRM Integration',
      'Analytics Dashboard',
      'Priority Support',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlyPrice: 197,
    features: [
      'Unlimited AI Funnel Pages',
      'AI Copywriting + A/B Testing',
      'Custom Domains',
      'CRM + API Integrations',
      'Advanced Analytics',
      'White-label Option',
      'Dedicated Account Manager',
    ],
  },
];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('grow');
  const [annual, setAnnual] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#202020',
    border: '1px solid #181818',
    borderRadius: '1px',
    color: '#F5F5F5',
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#00CFFF';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#181818';
  };

  const passwordValid = password.length >= 8;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Get CSRF token
      const csrfRes = await fetch('/api/auth/csrf');
      const { token: csrfToken } = await csrfRes.json();

      // Sign up
      const signupRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          plan: selectedPlan,
          billing: annual ? 'annual' : 'monthly',
          prompt,
        }),
      });

      if (!signupRes.ok) {
        const data = await signupRes.json();
        setError(data.error || 'Signup failed. Please try again.');
        setLoading(false);
        return;
      }

      // Create Stripe checkout session
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          type: 'subscription',
          plan: selectedPlan,
          billing: annual ? 'annual' : 'monthly',
        }),
      });

      if (!checkoutRes.ok) {
        const data = await checkoutRes.json();
        setError(data.error || 'Could not create checkout session.');
        setLoading(false);
        return;
      }

      const { url: checkoutUrl } = await checkoutRes.json();
      window.location.href = checkoutUrl;
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const getPrice = (monthly: number) => {
    if (annual) {
      return Math.round((monthly * 10) / 12);
    }
    return monthly;
  };

  const getSavings = (monthly: number) => {
    return monthly * 2;
  };

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          style={{
            width: '40px',
            height: '3px',
            backgroundColor: s <= step ? '#00CFFF' : '#181818',
            borderRadius: '1px',
            transition: 'background-color 0.3s',
          }}
        />
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h2 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '28px',
        color: '#F5F5F5',
        marginBottom: '8px',
        textAlign: 'center',
      }}>
        Describe Your Business
      </h2>
      <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
        Our AI will build your page based on this description (optional)
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. I run a fitness coaching business helping busy professionals lose weight with personalized meal plans and virtual training sessions..."
        rows={5}
        style={{
          ...inputStyle,
          resize: 'vertical' as const,
          fontFamily: "'DM Sans', sans-serif",
          minHeight: '120px',
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={() => setStep(2)}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: 'transparent',
            color: '#999',
            border: '1px solid #181818',
            borderRadius: '1px',
            fontSize: '14px',
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          Skip
        </button>
        <button
          onClick={() => setStep(2)}
          style={{
            flex: 2,
            padding: '14px',
            backgroundColor: '#00CFFF',
            color: '#000',
            border: 'none',
            borderRadius: '1px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '28px',
        color: '#F5F5F5',
        marginBottom: '8px',
        textAlign: 'center',
      }}>
        Choose Your Plan
      </h2>
      <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>
        Start with a 7-day free trial. Cancel anytime.
      </p>

      {/* Annual toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <span style={{ color: !annual ? '#F5F5F5' : '#999', fontSize: '14px' }}>Monthly</span>
        <button
          onClick={() => setAnnual(!annual)}
          style={{
            width: '48px',
            height: '26px',
            borderRadius: '1px',
            border: '1px solid #181818',
            backgroundColor: annual ? '#00CFFF' : '#202020',
            position: 'relative',
            cursor: 'pointer',
            padding: 0,
            transition: 'background-color 0.2s',
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            backgroundColor: annual ? '#000' : '#999',
            borderRadius: '1px',
            position: 'absolute',
            top: '2px',
            left: annual ? '25px' : '3px',
            transition: 'left 0.2s',
          }} />
        </button>
        <span style={{ color: annual ? '#F5F5F5' : '#999', fontSize: '14px' }}>
          Annual
          <span style={{
            color: '#00FF94',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            marginLeft: '6px',
          }}>
            Save 2 months
          </span>
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            style={{
              backgroundColor: '#060606',
              border: selectedPlan === plan.id ? '2px solid #00CFFF' : '1px solid #181818',
              borderRadius: '1px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '22px',
                color: selectedPlan === plan.id ? '#00CFFF' : '#F5F5F5',
                margin: 0,
              }}>
                {plan.name}
              </h3>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#F5F5F5',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  ${getPrice(plan.monthlyPrice)}
                </span>
                <span style={{ color: '#999', fontSize: '14px' }}>/mo</span>
                {annual && (
                  <div style={{
                    color: '#00FF94',
                    fontSize: '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    Save ${getSavings(plan.monthlyPrice)}/yr
                  </div>
                )}
              </div>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {plan.features.map((feature, i) => (
                <li key={i} style={{
                  color: '#999',
                  fontSize: '13px',
                  padding: '3px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{ color: '#00FF94', fontSize: '12px' }}>&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={() => setStep(1)}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: 'transparent',
            color: '#999',
            border: '1px solid #181818',
            borderRadius: '1px',
            fontSize: '14px',
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          Back
        </button>
        <button
          onClick={() => setStep(3)}
          style={{
            flex: 2,
            padding: '14px',
            backgroundColor: '#00CFFF',
            color: '#000',
            border: 'none',
            borderRadius: '1px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '28px',
        color: '#F5F5F5',
        marginBottom: '8px',
        textAlign: 'center',
      }}>
        Create Your Account
      </h2>
      <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
        Enter your details to get started
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', color: '#999', fontSize: '13px', marginBottom: '6px' }}>
          Full Name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', color: '#999', fontSize: '13px', marginBottom: '6px' }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label style={{ display: 'block', color: '#999', fontSize: '13px', marginBottom: '6px' }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      <p style={{
        fontSize: '12px',
        color: passwordValid ? '#00FF94' : '#999',
        margin: '4px 0 0 0',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {passwordValid ? '✓' : '○'} 8+ characters
      </p>

      {error && (
        <div style={{
          backgroundColor: 'rgba(255, 59, 59, 0.1)',
          border: '1px solid #FF3B3B',
          borderRadius: '1px',
          padding: '12px 16px',
          marginTop: '16px',
          color: '#FF3B3B',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={() => setStep(2)}
          style={{
            flex: 1,
            padding: '14px',
            backgroundColor: 'transparent',
            color: '#999',
            border: '1px solid #181818',
            borderRadius: '1px',
            fontSize: '14px',
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          Back
        </button>
        <button
          onClick={() => {
            if (!fullName || !email || !passwordValid) {
              setError('Please fill in all fields. Password must be 8+ characters.');
              return;
            }
            setError('');
            setStep(4);
          }}
          style={{
            flex: 2,
            padding: '14px',
            backgroundColor: (!fullName || !email || !passwordValid) ? '#4a4a4a' : '#00CFFF',
            color: '#000',
            border: 'none',
            borderRadius: '1px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: (!fullName || !email || !passwordValid) ? 'not-allowed' : 'pointer',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const plan = plans.find((p) => p.id === selectedPlan);
    return (
      <div>
        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '28px',
          color: '#F5F5F5',
          marginBottom: '8px',
          textAlign: 'center',
        }}>
          Start Your Free Trial
        </h2>

        <div style={{
          backgroundColor: '#060606',
          border: '1px solid #181818',
          borderRadius: '1px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '20px',
                color: '#00CFFF',
              }}>
                {plan?.name}
              </span>
              <span style={{
                color: '#999',
                fontSize: '13px',
                marginLeft: '8px',
              }}>
                {annual ? 'Annual' : 'Monthly'}
              </span>
            </div>
            <span style={{ color: '#F5F5F5', fontWeight: 700, fontSize: '18px' }}>
              ${plan ? getPrice(plan.monthlyPrice) : 0}/mo
            </span>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(0, 207, 255, 0.05)',
          border: '1px solid rgba(0, 207, 255, 0.2)',
          borderRadius: '1px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <p style={{
            color: '#00CFFF',
            fontSize: '14px',
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}>
            7-day free trial
          </p>
          <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>
            Not charged until Day 8. Cancel anytime.
          </p>
        </div>

        <p style={{
          color: '#999',
          fontSize: '12px',
          textAlign: 'center',
          marginBottom: '20px',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Credit card required to start trial
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 59, 59, 0.1)',
            border: '1px solid #FF3B3B',
            borderRadius: '1px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#FF3B3B',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setStep(3)}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: 'transparent',
              color: '#999',
              border: '1px solid #181818',
              borderRadius: '1px',
              fontSize: '14px',
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
            }}
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 2,
              padding: '14px',
              backgroundColor: loading ? '#4a4a4a' : '#00FF94',
              color: '#000',
              border: 'none',
              borderRadius: '1px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Processing...' : 'Start Free Trial →'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#0e0e0e',
        border: '1px solid #181818',
        borderRadius: '1px',
        padding: '48px 36px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '36px',
            color: '#00CFFF',
            letterSpacing: '2px',
            margin: 0,
          }}>
            GoElev8.ai
          </h1>
        </div>

        {renderStepIndicator()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <p style={{
          textAlign: 'center',
          marginTop: '28px',
          color: '#999',
          fontSize: '14px',
        }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{
            color: '#00CFFF',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            Sign in
          </Link>
        </p>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: '#4a4a4a',
          fontSize: '11px',
        }}>
          © 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
        </p>
      </div>
    </div>
  );
}
