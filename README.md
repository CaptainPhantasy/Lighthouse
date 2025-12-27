# Lighthouse - A compassionate AI companion for grief

In the quiet moments after loss, when the world feels overwhelming and the heart is heavy, there is light. Lighthouse is here to be that light—a gentle companion walking beside you during one of life's most difficult journeys.

## With Compassion, Not Complexity

We believe that when you're grieving, you shouldn't have to navigate complex systems or remember countless details. Lighthouse was created to lift that burden, offering a warm hand to hold during a time when you need it most.

### More Than an App, It's a Companion

Lighthouse understands that every grief journey is unique. It meets you where you are, with kindness and patience, helping you organize what needs to be done while honoring the love you shared.

**For your loved one's memory:**
- ✨ Create meaningful farewell celebrations that reflect their unique spirit
- 📝 Capture stories and memories that will be treasured for generations
- 🎵 Guide thoughtful ceremonies that comfort and bring peace

**For your well-being:**
- 🌅 Prioritize your needs with a brain-fog aware task system
- 🤝 Delegate with dignity when you need support
- 🛡️ Find trusted resources without the overwhelm

## When You Feel Like You're Alone

You're not. Lighthouse was built with deep compassion for the human experience of loss. It doesn't replace the care of friends and family—it helps you extend that care more effectively.

Each feature comes from listening to those who've walked this path before you. We've learned that organization and compassion aren't opposites—they work together to create space for healing.

## A Space for Remembering

At its heart, Lighthouse is about creating space. Space to grieve, to remember, to celebrate, and to begin healing. We provide the structure so you can focus on what matters most: honoring your loved one and caring for yourself and your family.

Because when you're navigating loss, you deserve a light to guide you—not another thing to worry about. 💙

---

## Technical Features

- **Trauma-Informed Design**: UI adapts to user's cognitive state (brain fog level)
- **Smart Document Vault**: AI-powered document scanning and analysis
- **Task Management**: Prioritized task delegation and completion tracking
- **Voice-First Accessibility**: Speech-to-text input throughout the application
- **Local Legal Guidance**: Grounded information about local probate requirements
- **Zero-Knowledge Security**: End-to-end encryption of sensitive data
- **Compassionate AI Assistant**: Emotional support and guidance throughout the process

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Motion**: Framer Motion
- **3D Graphics**: Three.js with React Three Fiber
- **AI Integration**: Google Gemini API
- **Icons**: Lucide React & Tabler Icons
- **Security**: Web Crypto API (SubtleCrypto)

## Getting Started

### Prerequisites

- Node.js 18+
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lighthouse
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Connect your repository to Vercel:
```bash
npm i -g vercel
vercel
```

3. During deployment, Vercel will automatically detect:
   - The React build configuration
   - The environment variables
   - The static build output

4. Set the GEMINI_API_KEY environment variable in the Vercel dashboard

### Other Platforms

The build output is in the `dist` directory. You can deploy to:
- Netlify
- AWS S3 + CloudFront
- GitHub Pages
- Any static site hosting

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | Yes |

## Security Features

- **Zero-Knowledge Encryption**: All sensitive data is encrypted using SubtleCrypto
- **Data Sanitization**: PII is automatically removed from memory
- **Local Storage Security**: Data is encrypted before being stored
- **Secure Key Derivation**: Uses PBKDF2 with 100,000 iterations

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Support

If you or someone you know is experiencing grief, please reach out to:

- Crisis Text Line: Text HOME to 741741
- National Suicide Prevention Lifeline: 988
- The Compassionate Friends: 877-969-0010

Remember: You don't have to go through this alone.

---

*With deepest respect for every heart that has loved and lost.*
