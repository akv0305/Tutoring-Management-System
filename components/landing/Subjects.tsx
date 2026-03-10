import React from "react"

const SUBJECTS: string[] = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English Language Arts",
  "Computer Science",
  "AP Calculus",
  "AP Physics",
  "IB Mathematics",
  "SAT Prep",
  "ACT Prep",
  "Coding & Python",
]

export function Subjects() {
  return (
    <section id="subjects" className="bg-[#F8FAFC] py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-semibold tracking-wider uppercase mb-4">
            What We Teach
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A5F] mb-4">
            Subjects We Cover
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            K-12, AP, IB and Test Prep
          </p>
        </div>

        {/* Subject pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              type="button"
              className="group px-5 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-[#1E293B] hover:border-[#0D9488] hover:text-[#0D9488] hover:bg-[#0D9488]/5 hover:shadow-sm transition-all duration-150"
            >
              {subject}
            </button>
          ))}
        </div>

        {/* Bottom card – All levels */}
        <div
          className="rounded-2xl p-8 text-center text-white shadow-xl"
          style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #0D9488 100%)" }}
        >
          <h3 className="text-xl font-bold mb-2">Don't see your subject?</h3>
          <p className="text-white/80 text-sm mb-5 max-w-sm mx-auto">
            We cover 50+ subjects across all grades. Contact us and we'll match you with the right tutor.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F59E0B] text-[#1E293B] font-bold text-sm hover:bg-[#e08d00] transition-colors shadow-md"
          >
            View All Subjects →
          </button>
        </div>
      </div>
    </section>
  )
}
