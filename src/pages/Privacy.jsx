import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="10 mai 2026">
      <Section title="1. Données collectées">
        <p>DevBoost collecte le strict minimum :</p>
        <ul>
          <li>
            <strong>Email</strong> : pour créer ton compte, t’authentifier et envoyer les
            mails de réinitialisation de mot de passe.
          </li>
          <li>
            <strong>Prénom</strong> : pour personnaliser l’interface (« Salut Léa »).
            Optionnel.
          </li>
          <li>
            <strong>Mot de passe</strong> : haché par Supabase (bcrypt). Jamais stocké en
            clair, jamais visible côté éditeur.
          </li>
          <li>
            <strong>Données d’utilisation</strong> : tes XP, ton streak, tes sessions
            terminées, ta progression dans les cours et l’historique SM-2 de chaque carte
            révisée. Ces données servent à faire fonctionner la répétition espacée et à
            t’afficher tes statistiques.
          </li>
          <li>
            <strong>Cartes personnelles</strong> : si tu en crées dans la Bibliothèque,
            elles sont stockées dans ton compte.
          </li>
        </ul>
        <p>
          DevBoost <strong>ne collecte aucune donnée de navigation</strong> (cookies
          tiers, traceurs publicitaires, fingerprinting, etc.).
        </p>
      </Section>

      <Section title="2. Hébergement et stockage">
        <p>
          Les données utilisateur sont stockées par <strong>Supabase</strong> (PostgreSQL
          managé), hébergé sur AWS dans la région définie à la création du projet. Toutes
          les tables sont protégées par <em>Row Level Security</em> : chaque utilisateur ne
          peut lire ou modifier que ses propres lignes, jamais celles d’un autre.
        </p>
        <p>
          L’application elle-même est servie par <strong>Vercel</strong>. Aucun serveur
          intermédiaire ne traite tes données.
        </p>
        <p>
          Une copie locale est conservée dans <strong>IndexedDB</strong> sur ton
          appareil pour permettre l’usage hors-ligne. Cette copie peut être supprimée
          via <em>Réglages → Réinitialiser DevBoost</em> ou en effaçant les données du site
          dans ton navigateur.
        </p>
      </Section>

      <Section title="3. Authentification tierce (Google / GitHub)">
        <p>
          Si tu te connectes via Google ou GitHub, ces services nous transmettent
          uniquement ton email et un identifiant unique. Aucune autre information
          (contacts, photos, dépôts…) n’est demandée. Tu peux révoquer l’accès à tout
          moment depuis les réglages de sécurité du provider concerné.
        </p>
      </Section>

      <Section title="4. Cookies et stockage navigateur">
        <p>DevBoost utilise :</p>
        <ul>
          <li>
            <strong>localStorage Supabase</strong> : stocke ton token de session pour
            rester connecté.
          </li>
          <li>
            <strong>IndexedDB</strong> : copie locale des cartes, sessions, progression.
          </li>
          <li>
            <strong>Service Worker (PWA)</strong> : cache des fichiers statiques pour le
            mode offline.
          </li>
        </ul>
        <p>
          Aucun cookie tiers, aucun traceur publicitaire, aucune analytics par défaut.
        </p>
      </Section>

      <Section title="5. Tes droits (RGPD)">
        <p>Tu disposes des droits suivants :</p>
        <ul>
          <li>
            <strong>Accès / portabilité</strong> : récupérer toutes tes données via
            l’export Supabase ou en demande directe.
          </li>
          <li>
            <strong>Rectification</strong> : modifier ton prénom, ton email ou ton mot de
            passe depuis les Réglages.
          </li>
          <li>
            <strong>Suppression</strong> : supprimer ton compte via{' '}
            <em>Réglages → Compte</em> (à venir) ou en envoyant une demande GitHub.
            Toutes les données associées (stats, sessions, reviews, cartes perso) sont
            alors effacées en cascade grâce aux contraintes <code>on delete cascade</code>.
          </li>
          <li>
            <strong>Opposition</strong> : tu peux à tout moment cesser d’utiliser
            l’application.
          </li>
        </ul>
      </Section>

      <Section title="6. Conservation">
        <p>
          Les données sont conservées tant que ton compte est actif. À la suppression du
          compte, elles sont effacées immédiatement et définitivement.
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          Pour toute question liée à la confidentialité, ouvre une issue sur le dépôt
          GitHub :{' '}
          <a
            href="https://github.com/JavaChrist/DevBoost"
            className="text-emerald-400 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            JavaChrist/DevBoost
          </a>
          .
        </p>
      </Section>

      <p className="pt-4 text-center">
        <Link to="/terms" className="text-emerald-400 hover:underline">
          ← Conditions générales d’utilisation
        </Link>
      </p>
    </LegalLayout>
  );
}

// --- Layout partagé (dupliqué de Terms.jsx pour rester autonomes) ---

function LegalLayout({ title, updated, children }) {
  return (
    <section className="flex flex-col gap-4 p-4 pb-12">
      <header className="pt-2">
        <Link
          to="/"
          className="mb-2 inline-block text-xs font-semibold text-emerald-400 hover:underline"
        >
          ← Retour
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-[11px] text-slate-500">Dernière mise à jour : {updated}</p>
      </header>
      <article className="space-y-5 text-sm leading-relaxed text-slate-300">{children}</article>
    </section>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-bold tracking-tight text-slate-100">{title}</h2>
      <div className="space-y-2 [&_a]:text-emerald-400 [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}
