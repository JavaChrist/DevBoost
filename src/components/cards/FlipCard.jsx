// Carte 3D recto/verso. CSS pur, pas de framer-motion (réservé au swipe étape 9).
//
// Usage :
//   <FlipCard flipped={isFlipped} front={<…recto…/>} back={<…verso…/>} />
//
// La hauteur s'aligne sur la face la plus grande grâce au grid stack.

export default function FlipCard({ flipped = false, front, back, className = '' }) {
  return (
    <div className={['w-full min-w-0 perspective-1000', className].join(' ')}>
      <div
        className={[
          'relative grid w-full min-w-0 preserve-3d transition-transform duration-700 ease-out',
          flipped ? 'rotate-y-180' : '',
        ].join(' ')}
        style={{ gridTemplateAreas: '"stack"' }}
      >
        <div
          className="backface-hidden col-start-1 row-start-1 w-full min-w-0"
          style={{ gridArea: 'stack' }}
          aria-hidden={flipped}
        >
          {front}
        </div>
        <div
          className="backface-hidden rotate-y-180 col-start-1 row-start-1 w-full min-w-0"
          style={{ gridArea: 'stack' }}
          aria-hidden={!flipped}
        >
          {back}
        </div>
      </div>
    </div>
  );
}
