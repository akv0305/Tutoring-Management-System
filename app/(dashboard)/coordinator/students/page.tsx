"use client"

import React from "react"
import { Download, Eye, Calendar, CreditCard, Package, AlertCircle } from "lucide-react"
import { DataTable } from "@/components/tables/DataTable"
import { StatusBadge } from "@/components/ui/StatusBadge"

type Student = Record<string, unknown> & {
  id: string; studentName: string; parentName: string; grade: string
  subjects: string[]; packageStatus: string; classesRemaining: string
  nextClass: string; teacher: string; actionType: string
}

const STUDENTS: Student[] = [
  { id:"1", studentName:"Alex Smith",     parentName:"Jane Smith",    grade:"Grade 8",  subjects:["Math"],                packageStatus:"active",          classesRemaining:"5",  nextClass:"Mar 10, 9AM",    teacher:"Dr. Ananya",  actionType:"calendar" },
  { id:"2", studentName:"Maya Johnson",   parentName:"Robert Johnson",grade:"Grade 10", subjects:["Physics","SAT"],       packageStatus:"active",          classesRemaining:"3",  nextClass:"Mar 10, 10:30AM",teacher:"Prof. Vikram", actionType:"calendar" },
  { id:"3", studentName:"Ryan Chen",      parentName:"Lisa Chen",     grade:"Grade 6",  subjects:["Math"],                packageStatus:"active",          classesRemaining:"7",  nextClass:"Mar 10, 2PM",    teacher:"Dr. Ananya",  actionType:"calendar" },
  { id:"4", studentName:"Priya Patel",    parentName:"Vikram Patel",  grade:"Grade 11", subjects:["Chemistry"],           packageStatus:"pending_payment", classesRemaining:"0",  nextClass:"—",              teacher:"Mr. Suresh",  actionType:"payment"  },
  { id:"5", studentName:"Aiden Brown",    parentName:"Maria Brown",   grade:"Grade 12", subjects:["ACT Prep"],            packageStatus:"trial",           classesRemaining:"1",  nextClass:"Mar 12, 3PM",    teacher:"Prof. Vikram",actionType:"calendar" },
  { id:"6", studentName:"Noah Martinez",  parentName:"Carlos Martinez",grade:"Grade 10",subjects:["Math"],               packageStatus:"trial_completed", classesRemaining:"0",  nextClass:"—",              teacher:"Dr. Ananya",  actionType:"package"  },
  { id:"7", studentName:"Emma Wilson",    parentName:"Kate Wilson",   grade:"Grade 9",  subjects:["Science"],             packageStatus:"trial",           classesRemaining:"1",  nextClass:"Mar 11, 4PM",    teacher:"Mr. Suresh",  actionType:"calendar" },
  { id:"8", studentName:"Ethan Williams", parentName:"Sarah Williams",grade:"Grade 9",  subjects:["English"],             packageStatus:"inactive",        classesRemaining:"0",  nextClass:"—",              teacher:"Ms. Deepika", actionType:"alert"    },
]

function ActionButtons({ row }: { row: Student }) {
  const type = row.actionType
  return (
    <div className="flex items-center gap-1">
      <button title="View"  className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
      {type === "calendar" && <button title="Schedule"         className="p-1.5 rounded-md text-[#1E3A5F] hover:bg-blue-50 transition-colors"><Calendar    className="w-3.5 h-3.5" /></button>}
      {type === "payment"  && <button title="Confirm Payment"  className="p-1.5 rounded-md text-[#F59E0B] hover:bg-amber-50 transition-colors"><CreditCard  className="w-3.5 h-3.5" /></button>}
      {type === "package"  && <button title="Assign Package"   className="p-1.5 rounded-md text-[#0D9488] hover:bg-teal-50 transition-colors"><Package     className="w-3.5 h-3.5" /></button>}
      {type === "alert"    && <button title="Follow Up"        className="p-1.5 rounded-md text-[#EF4444] hover:bg-red-50 transition-colors"><AlertCircle className="w-3.5 h-3.5" /></button>}
    </div>
  )
}

const columns = [
  { key:"studentName",      label:"Student Name",      sortable:true,  render:(r:Student)=>(<span className="font-medium text-[#1E293B]">{r.studentName}</span>) },
  { key:"parentName",       label:"Parent Name",       sortable:true,  render:(r:Student)=>(<span className="text-gray-600 text-sm">{r.parentName}</span>) },
  { key:"grade",            label:"Grade",             sortable:true,  render:(r:Student)=>(<span className="text-sm text-gray-600">{r.grade}</span>) },
  { key:"subjects",         label:"Subjects",          render:(r:Student)=>(
    <div className="flex flex-wrap gap-1">
      {(r.subjects as string[]).map(s=>(
        <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-50 text-teal-700 border border-teal-200">{s}</span>
      ))}
    </div>
  )},
  { key:"packageStatus",    label:"Package Status",    sortable:true,  render:(r:Student)=>(<StatusBadge status={r.packageStatus as string} size="sm" />) },
  { key:"classesRemaining", label:"Classes Left",      sortable:true,  render:(r:Student)=>(
    <span className={`font-semibold text-sm ${r.classesRemaining==="0"?"text-[#EF4444]":Number(r.classesRemaining)<=3?"text-[#F59E0B]":"text-[#22C55E]"}`}>
      {r.classesRemaining}
    </span>
  )},
  { key:"nextClass",        label:"Next Class",        render:(r:Student)=>(<span className="text-xs text-gray-500">{r.nextClass}</span>) },
  { key:"teacher",          label:"Teacher",           render:(r:Student)=>(<span className="text-sm text-gray-600">{r.teacher}</span>) },
  { key:"actions",          label:"Actions",           render:(r:Student)=>(<ActionButtons row={r} />) },
]

function MiniKPI({label,value,valueClass="text-[#1E293B]"}:{label:string;value:string|number;valueClass?:string}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}

export default function CoordinatorStudentsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">My Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">Students assigned to your bucket</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />Export
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MiniKPI label="Total Assigned" value={42} />
        <MiniKPI label="Active"         value={35} valueClass="text-[#22C55E]" />
        <MiniKPI label="Trial Phase"    value={5}  valueClass="text-[#F59E0B]" />
        <MiniKPI label="Inactive"       value={2}  valueClass="text-gray-400"  />
      </div>

      <DataTable
        columns={columns as Parameters<typeof DataTable>[0]["columns"]}
        data={STUDENTS as unknown as Record<string,unknown>[]}
        searchable searchPlaceholder="Search students..." pageSize={10}
      />
    </div>
  )
}
