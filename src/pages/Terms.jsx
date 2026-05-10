import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <LegalLayout title="Conditions générales d’utilisation" updated="10 mai 2026">
      <Section title="1. Objet">
        <p>
          DevBoost est une application d’entraînement pour développeurs proposant des sessions
          courtes de quiz et de challenges code, avec un système de répétition espacée. Les
          présentes conditions encadrent l’utilisation du service.
        </p>
      </Section>

      <Section title="2. Accès au service">
        <p>
          L’accès à DevBoost nécessite la création d’un compte (email + mot de passe, ou via
          un compte Google / GitHub). L’utilisateur s’engage à fournir des informations
          exactes et à conserver ses identifiants confidentiels.
        </p>
        <p>
          Le service est gratuit. Aucune obligation d’assiduité ni d’abonnement n’est
          requise. L’utilisateur peut supprimer son compte à tout moment depuis les Réglages.
        </p>
      </Section>

      <Section title="3. Comportement attendu">
        <p>L’utilisateur s’engage à ne pas :</p>
        <ul>
          <li>tenter de contourner les mécanismes d’authentification ou de Row Level Security ;</li>
          <li>utiliser le service à des fins illégales, malveillantes ou commerciales non autorisées ;</li>
          <li>injecter du code dans les challenges visant à perturber le fonctionnement de l’application ;</li>
          <li>scrapper massivement le contenu pédagogique (cours, cartes).</li>
        </ul>
      </Section>

      <Section title="4. Propriété intellectuelle">
        <p>
          Le contenu pédagogique de DevBoost (cours, quiz, challenges) est protégé. Il est
          mis à disposition pour un usage personnel d’apprentissage. Toute reproduction
          publique ou commerciale sans autorisation est interdite.
        </p>
        <p>
          Les cartes créées par l’utilisateur dans la Bibliothèque restent sa propriété et
          ne sont jamais partagées avec d’autres utilisateurs.
        </p>
      </Section>

      <Section title="5. Disponibilité et limitation de responsabilité">
        <p>
          DevBoost est fourni « en l’état », sans garantie d’absence d’interruption ou
          d’erreur. L’éditeur ne saurait être tenu responsable des conséquences d’une
          indisponibilité temporaire, d’une perte de progression ou d’une modification du
          contenu pédagogique.
        </p>
      </Section>

      <Section title="6. Modification des CGU">
        <p>
          Les présentes conditions peuvent être mises à jour. La date de dernière mise à
          jour est indiquée en haut de cette page.
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          Pour toute question, ouvre une issue sur le dépôt GitHub :{' '}
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
        <Link to="/privacy" className="text-emerald-400 hover:underline">
          Politique de confidentialité →
        </Link>
      </p>
    </LegalLayout>
  );
}

// --- Layout partagé (extrait pour réutilisation dans Privacy.jsx) ---

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
