export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-extrabold text-white">Пользовательское соглашение</h1>
        <p className="text-slate-400">Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</p>
        
        <div className="space-y-6 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Общие положения</h2>
            <p>
              Настоящее Соглашение регулирует отношения между платформой LearnHub (далее «Платформа») и её пользователями (учениками, родителями, преподавателями). Регистрируясь на Платформе, вы принимаете условия данного соглашения.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Права и обязанности</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Ученики:</strong> обязуются соблюдать правила платформы, не использовать нецензурную лексику, уважительно относиться к преподавателям и другим студентам.</li>
              <li><strong>Родители (для детей до 14 лет):</strong> несут ответственность за действия своих детей на платформе и дают согласие на их участие в образовательном процессе.</li>
              <li><strong>Преподаватели:</strong> обязуются предоставлять достоверные материалы, не содержащие запрещенной или вредной информации (маркировка 6+).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Правила поведения</h2>
            <p>
              На Платформе строжайше запрещено:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Распространение спама и любой рекламы.</li>
              <li>Оскорбления, буллинг, угрозы в адрес других пользователей.</li>
              <li>Загрузка файлов, картинок или текстов, содержащих жестокость, насилие или другой опасный контент.</li>
            </ul>
            <p className="mt-2 text-rose-400">
              При нарушении правил администрация имеет право заблокировать или полностью удалить аккаунт нарушителя без предупреждения.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Оплата и платные функции</h2>
            <p>
              Если Платформа предоставляет платный функционал (покупка курсов, подписок, внутриигровой валюты), все транзакции регулируются отдельными правилами возврата средств. Возврат средств за уже оказанные образовательные услуги не производится.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
