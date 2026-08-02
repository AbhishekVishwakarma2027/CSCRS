import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FAQItem {
  id: number
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 1,
    question: 'How is my civic issue routed to the correct department?',
    answer:
      'Our AI categorization module evaluates the reported photo and textual description against historical ticket patterns, automatically matching and forwarding the report to the corresponding municipal department.',
  },
  {
    id: 2,
    question: 'What is the SLA target for urgent civic issues?',
    answer:
      'Urgent safety hazards (e.g. open manholes, active water main breaks) trigger high-priority alerts with a strict 24-hour resolution SLA. Non-critical public cleaning operations adhere to standard 5-day resolution SLAs.',
  },
  {
    id: 3,
    question: 'How are field worker completions verified by administrators?',
    answer:
      'Field workers must upload geo-tagged photo evidence from the exact reporting coordinates before closing a ticket. Department Admins manually review the onsite resolution proof before final closure is permitted.',
  },
  {
    id: 4,
    question: 'Are citizen reports publicly viewable in the system?',
    answer:
      'Yes. Reports are listed publicly on the citizen dashboard (excluding personal reporter details) to prevent duplicate reports and maintain full visual resolution transparency.',
  },
]

export function FAQSection() {
  const [openId, setOpenId] = useState<number | null>(null)

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section id="faq" className="border-neutral-150 border-b bg-neutral-50/50 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-primary text-xs font-extrabold tracking-widest uppercase">
            Help Desk
          </h2>
          <p className="text-neutral-855 mt-1 text-3xl font-black">Frequently Asked Questions</p>
          <div className="bg-primary mx-auto mt-3 h-1 w-12 rounded" />
        </div>

        <div className="mx-auto max-w-3xl space-y-3">
          {FAQ_ITEMS.map((faq) => {
            const isOpen = openId === faq.id

            return (
              <div
                key={faq.id}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:border-neutral-300"
              >
                {/* Accordion Trigger Header */}
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-neutral-800 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center space-x-3 pr-4">
                    <HelpCircle className="h-4.5 w-4.5 shrink-0 text-neutral-400" />
                    <span className="leading-tight tracking-tight">{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-300 ${
                      isOpen ? 'text-primary rotate-180 transform' : ''
                    }`}
                  />
                </button>

                {/* Accordion Content Panel (with smooth transition animation) */}
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-40 border-t border-neutral-100' : 'max-h-0'
                  } overflow-hidden`}
                >
                  <p className="bg-neutral-50/30 p-5 text-xs leading-relaxed text-neutral-500">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
