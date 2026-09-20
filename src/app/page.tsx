import BetaForm from "@/components/BetaForm";

/**
 * Landing de la beta.
 *
 * El CTA es el formulario de la reunión, no una captura de correo: la beta se
 * entra por una conversación de 15 minutos, no por un alta automática. Los
 * datos se guardan antes de mostrar el calendario, así el que abandona ahí
 * entra igual a la secuencia de correos (que son recordatorios de agendar).
 *
 * Lo que la landing dice y lo que el producto hace tienen que coincidir. Dos
 * cosas que estaban y se sacaron por eso: la promesa de un panel
 * multi-cliente para estudios contables (el portal del contador no existe) y
 * la presentación de préstamos, echeqs y liquidaciones como si vinieran
 * incluidos — son módulos opcionales.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="bg-navy px-6 py-4 flex items-center justify-between">
        <div className="text-white font-bold text-lg tracking-tight">
          On<span className="text-accent">Concilia</span>
        </div>
        <a
          href="#beta"
          className="bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          Agendar 15 minutos
        </a>
      </nav>

      {/* Hero */}
      <section className="bg-navy px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-blue-300 px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
          Beta cerrada — 20 lugares
        </div>

        <h1 className="text-white text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight max-w-2xl mx-auto mb-5 text-balance">
          ¿Seguís haciendo la conciliación bancaria{" "}
          <em className="text-accent not-italic">en Excel?</em>
        </h1>

        <p className="text-slate-300 max-w-xl mx-auto text-base leading-relaxed mb-8">
          OnConcilia importa el extracto de tus bancos y de tu cuenta de
          Mercado Pago, categoriza los movimientos y genera el reporte listo
          para tu contador. En minutos, no en horas.
        </p>

        <BetaForm fuente="landing_hero" />
      </section>

      {/* Qué incluye la beta */}
      <section className="bg-slate-50 px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-brand text-xs font-semibold uppercase tracking-widest mb-2">
            La beta
          </p>
          <h2 className="text-navy text-2xl font-bold mb-3 tracking-tight">
            60 días del plan Pro, sin cargo
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-2xl">
            No es un acceso de prueba con la mitad de las funciones. Son 20
            lugares, y quien entra arranca con la cuenta ya cargada y andando.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg mb-3">
                ⭐
              </div>
              <h3 className="font-semibold text-navy text-sm mb-1">
                El plan Pro completo
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Cinco bancos más la billetera, ocho usuarios y dos módulos
                opcionales a elección.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg mb-3">
                📚
              </div>
              <h3 className="font-semibold text-navy text-sm mb-1">
                90 días de historial cargado
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                De todas tus cuentas, cargado por nosotros. Entrás y ya tenés
                tres meses para comparar, no una pantalla vacía.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg mb-3">
                🏦
              </div>
              <h3 className="font-semibold text-navy text-sm mb-1">
                Tu banco, aunque no esté
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Si trabajás con un banco que todavía no leemos, desarrollamos
                la lectura y la categorización sin cargo.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="font-semibold text-navy text-base mb-2">
              Qué te pedimos a cambio
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Dos encuestas cortas: una a los 15 días y otra a los 45. Qué
              usaste, qué no se entendió y qué te falta. Eso es todo — y por
              ese trabajo, al terminar la beta seguís con{" "}
              <strong className="text-navy">50% de descuento durante 3 meses</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Para quién */}
      <section className="bg-white px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-brand text-xs font-semibold uppercase tracking-widest mb-2">
            Para quién
          </p>
          <h2 className="text-navy text-2xl font-bold mb-8 tracking-tight">
            El cierre de mes no debería ser un caos
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg mb-3">
                🏢
              </div>
              <h3 className="font-semibold text-navy text-sm mb-1">
                Pymes de servicios y retail
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                1 a 3 personas en administración que cierran el mes con Excel.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg mb-3">
                💳
              </div>
              <h3 className="font-semibold text-navy text-sm mb-1">
                Comercios que cobran por todos lados
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Banco, Mercado Pago, tarjetas y transferencias. Cuantas más
                fuentes, más horas se van en cruzarlas.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg mb-3">
                🏪
              </div>
              <h3 className="font-semibold text-navy text-sm mb-1">
                Franquicias y cadenas
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Varios locales, varias cuentas. El problema escala con cada uno.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-slate-50 px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-brand text-xs font-semibold uppercase tracking-widest mb-2">
            Cómo funciona
          </p>
          <h2 className="text-navy text-2xl font-bold mb-8 tracking-tight">
            Tres pasos, sin instalación
          </h2>

          <div className="flex flex-col divide-y divide-slate-200">
            {[
              {
                n: "1",
                title: "Importás el extracto bancario",
                desc: "Subí tu extracto en CSV o Excel — OnConcilia reconoce el formato de cada banco y lo mapea automáticamente.",
              },
              {
                n: "2",
                title: "OnConcilia lo procesa automáticamente",
                desc: "Normaliza los movimientos, los categoriza según las reglas de tu empresa y agrupa lo que no reconoce para que lo resuelvas en lote.",
              },
              {
                n: "3",
                title: "El reporte se manda solo",
                desc: "PDF y Excel con todos los movimientos por banco, pendientes al cierre y resumen de categorías. Y el día 1 de cada mes sale solo, sin que nadie lo dispare.",
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-4 py-5 items-start">
                <div className="w-8 h-8 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-semibold text-navy text-base mb-1">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Saldos diarios — franja, no tarjeta: es una rutina, no una función más */}
      <section className="bg-navy px-6 py-8">
        <p className="max-w-3xl mx-auto text-slate-300 text-sm leading-relaxed text-center">
          Y todos los días, en dos minutos: anotás el saldo de cada cuenta,
          OnConcilia te muestra el anterior y la variación.{" "}
          <span className="text-white font-medium">
            Si no cambió, no hace falta bajar ningún extracto.
          </span>
        </p>
      </section>

      {/* Funciones */}
      <section className="bg-white px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-brand text-xs font-semibold uppercase tracking-widest mb-2">
            Funciones
          </p>
          <h2 className="text-navy text-2xl font-bold mb-8 tracking-tight">
            Todo lo que necesitás para cerrar el mes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg mb-4">
                🏦
              </div>
              <h3 className="font-semibold text-navy text-base mb-2">
                Bancos argentinos
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Subí el extracto de Nación, Santander, Macro, BICA, BERSA o
                Galicia y en segundos tenés todos los movimientos normalizados.
                Reconoce el formato de cada banco solo.
              </p>
              <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                Importación automática
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-lg mb-4">
                ⚡
              </div>
              <h3 className="font-semibold text-navy text-base mb-2">
                Miles de movimientos categorizados en un clic
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Ingresos, gastos, impuestos y comisiones se clasifican según
                las reglas de tu empresa. Lo que no reconoce lo agrupa para
                resolverlo en lote, sin revisar fila por fila.
              </p>
              <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">
                Reglas propias por banco
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-lg mb-4">
                💳
              </div>
              <h3 className="font-semibold text-navy text-base mb-2">
                Mercado Pago y Mercado Libre, junto a lo del banco
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Conectás la cuenta y OnConcilia averigua de cada venta si fue
                por QR, Point, link de pago o Mercado Libre, con el desglose de
                comisiones e impuestos de cada operación. Las compras y los
                costos de venta de Mercado Libre quedan separados de lo demás.
              </p>
              <span className="inline-block bg-violet-50 text-violet-700 text-xs font-medium px-3 py-1 rounded-full">
                Incluido en todos los planes
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-lg mb-4">
                🧾
              </div>
              <h3 className="font-semibold text-navy text-base mb-2">
                Comprobante de comisiones, armado solo
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Cada mes OnConcilia clasifica las comisiones bancarias por
                alícuota de IVA y genera el comprobante listo para tu contador.
                Sin calcular bases imponibles ni buscar percepciones a mano.
              </p>
              <span className="inline-block bg-rose-50 text-rose-700 text-xs font-medium px-3 py-1 rounded-full">
                IVA y percepciones desglosados
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg mb-4">
                📅
              </div>
              <h3 className="font-semibold text-navy text-base mb-2">
                Impuestos por período, con cierre
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Deja de ser una planilla que alguien rehace todos los meses.
                Los débitos impositivos quedan agrupados por período y el
                período se cierra.
              </p>
              <span className="inline-block bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">
                Se cierra y queda
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-lg mb-4">
                📈
              </div>
              <h3 className="font-semibold text-navy text-base mb-2">
                Plazos fijos y fondos, sin abrir el portal del banco
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-3">
                Registrá tus inversiones y vinculalas con los movimientos
                reales de la cuenta. OnConcilia te muestra cuánto tenés
                invertido y qué vence.
              </p>
              <span className="inline-block bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 rounded-full">
                Vencimientos a la vista
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Módulos opcionales */}
      <section className="bg-slate-50 px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <p className="text-brand text-xs font-semibold uppercase tracking-widest mb-2">
            Módulos opcionales
          </p>
          <h2 className="text-navy text-2xl font-bold mb-3 tracking-tight">
            Se suman si los necesitás
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-2xl">
            No todo el mundo trabaja con cheques electrónicos ni cobra con
            tarjeta. Estos cuatro van aparte, y en la beta elegís dos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icono: "📄",
                titulo: "Echeqs",
                desc: "Los cheques electrónicos emitidos y recibidos, con sus vencimientos y el cruce contra el movimiento real de la cuenta.",
              },
              {
                icono: "🏛️",
                titulo: "Préstamos",
                desc: "Préstamos bancarios con su cuadro de amortización, capital e interés separados y las cuotas que vienen.",
              },
              {
                icono: "🧮",
                titulo: "Liquidaciones de tarjeta",
                desc: "Aranceles, IVA y retenciones desglosados, cruzados contra lo que efectivamente entró a la cuenta.",
              },
              {
                icono: "📸",
                titulo: "Comprobantes",
                desc: "El cliente te transfiere y te manda la foto. Subís la imagen o el PDF y OnConcilia lee monto, fecha y número de operación, y busca solo contra qué movimiento cruzarlo.",
              },
            ].map((m) => (
              <div key={m.titulo} className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg mb-4">
                  {m.icono}
                </div>
                <h3 className="font-semibold text-navy text-base mb-2">{m.titulo}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section id="beta" className="bg-navy px-6 py-16 text-center">
        <h2 className="text-white text-2xl font-bold tracking-tight mb-3">
          Quedan lugares de la beta
        </h2>
        <p className="text-slate-400 text-sm mb-6 max-w-lg mx-auto leading-relaxed">
          Antes de activar ninguna cuenta hablamos 15 minutos: queremos
          entender cómo llevás hoy el banco y mostrarte qué te cambia. Si no te
          sirve, te lo decimos en esa misma llamada.
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {["Sin instalar nada", "Sin tarjeta", "Sin compromiso"].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-slate-400 text-xs">
              <span className="text-accent font-bold">✓</span>
              {item}
            </span>
          ))}
        </div>

        <BetaForm fuente="landing_cta" />
      </section>

      {/* Footer */}
      <footer className="bg-navy border-t border-white/10 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-slate-600 text-xs">
          OnConcilia · Paraná, Entre Ríos, Argentina
        </p>
        <p className="text-slate-600 text-xs">
          guillermo@onconcilia.com
        </p>
      </footer>

    </main>
  );
}
