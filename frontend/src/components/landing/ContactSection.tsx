import { Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ContactSection() {
  return (
    <section id="contact" className="bg-transparent py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
          {/* Left Column: Helpline Info */}
          <div className="space-y-6 lg:col-span-5">
            <h2 className="text-neutral-855 text-3xl font-black tracking-tight">
              Contact Information
            </h2>
            <div className="bg-primary h-1 w-12 rounded" />
            <p className="max-w-sm text-sm leading-relaxed text-neutral-500">
              [Placeholder: Connect with regional municipal helpdesks, check department grievance
              registries, or visit central operations offices.]
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-3 text-sm text-neutral-600">
                <div className="text-primary rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                  <Mail className="h-4 w-4" />
                </div>
                <span>support@cscrs-portal.gov.in</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-neutral-600">
                <div className="text-primary rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                  <Phone className="h-4 w-4" />
                </div>
                <span>1800-XXX-XXXX</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-neutral-600">
                <div className="text-primary rounded-lg border border-neutral-200 bg-neutral-50 p-2">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>Central Grievance Office, Administrative Block 4, Capital Complex</span>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Mock Form */}
          <div className="space-y-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm md:p-8 lg:col-span-7">
            <div>
              <h3 className="text-sm font-bold text-neutral-800">Send a Message</h3>
              <p className="mt-0.5 text-[13px] text-neutral-500">
                Have operational queries? Send an inquiry to the governance support desk.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-neutral-500 uppercase">
                  First Name
                </label>
                <div className="border-neutral-250 flex h-9 items-center rounded-lg border bg-white px-3 text-xs text-neutral-400">
                  [First name input placeholder]
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-neutral-500 uppercase">
                  Last Name
                </label>
                <div className="border-neutral-250 flex h-9 items-center rounded-lg border bg-white px-3 text-xs text-neutral-400">
                  [Last name input placeholder]
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-neutral-500 uppercase">
                Email Address
              </label>
              <div className="border-neutral-250 flex h-9 items-center rounded-lg border bg-white px-3 text-xs text-neutral-400">
                [Email address input placeholder]
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-neutral-500 uppercase">Message</label>
              <div className="border-neutral-250 h-24 rounded-lg border bg-white p-3 text-xs text-neutral-400">
                [Your message placeholder]
              </div>
            </div>
            <Button className="h-10 w-full rounded-lg font-bold tracking-tight shadow-md">
              Send Enquiry
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
