export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto prose prose-invert prose-sm">
      <h1 className="text-xl font-bold text-gray-100">Privacy Notice</h1>
      <p className="text-gray-400 text-xs mt-1">Effective: 2026. For GDPR, PIPEDA, and CCPA alignment.</p>

      <section className="mt-6 space-y-3 text-gray-300">
        <h2 className="text-base font-semibold text-gray-200">1. Who we are</h2>
        <p>GymTracker is a workout tracking application. This notice describes how we collect, use, and protect your personal information.</p>

        <h2 className="text-base font-semibold text-gray-200">2. What we collect</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account data:</strong> email address, password (stored hashed), account creation date.</li>
          <li><strong>Workout data:</strong> sessions, exercises, sets (reps, weight, duration), templates.</li>
          <li><strong>Consent record:</strong> date and version of the privacy notice when you consented.</li>
          <li><strong>Access logs:</strong> IP address, user agent, and action (e.g. login) for security and abuse prevention.</li>
        </ul>

        <h2 className="text-base font-semibold text-gray-200">3. Why we use it</h2>
        <p>We use your data to provide the service (account, workouts, history), to secure the application (auth, rate limiting, logs), and to comply with legal obligations.</p>

        <h2 className="text-base font-semibold text-gray-200">4. How long we keep it</h2>
        <p>We keep your account and workout data until you delete your account. Access logs may be retained for a limited period for security. You can request deletion at any time (see Your rights).</p>

        <h2 className="text-base font-semibold text-gray-200">5. Sharing</h2>
        <p>We do not sell your personal information. We do not share it with third parties except as required by law or to operate the service (e.g. hosting).</p>

        <h2 className="text-base font-semibold text-gray-200">6. Your rights (GDPR / PIPEDA / CCPA)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Access:</strong> You can export your data from the app (Settings → Export my data).</li>
          <li><strong>Erasure:</strong> You can delete your account and all associated data (Settings → Delete account).</li>
          <li><strong>Portability:</strong> The export is in JSON format for reuse.</li>
          <li><strong>Withdraw consent:</strong> You may withdraw consent by deleting your account. Withdrawal does not affect lawfulness of processing before withdrawal.</li>
        </ul>

        <h2 className="text-base font-semibold text-gray-200">7. Cookies</h2>
        <p>We use a single cookie to keep you logged in (strictly necessary for the service). We do not use tracking or advertising cookies. No consent banner is required for this essential cookie under the ePrivacy Directive.</p>

        <h2 className="text-base font-semibold text-gray-200">8. Changes</h2>
        <p>We may update this notice. If we make material changes, we will notify you (e.g. in-app or by email) and, where required by law, ask for your consent again.</p>

        <h2 className="text-base font-semibold text-gray-200">9. Contact</h2>
        <p>For privacy requests or questions, contact the application owner or your organization&apos;s privacy officer.</p>
      </section>
    </div>
  );
}
