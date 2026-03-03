'use client'

import React, { useState, useEffect, useRef } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { useRAGKnowledgeBase } from '@/lib/ragKnowledgeBase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  HiPaperAirplane as Send,
  HiChatBubbleLeftRight as MessageSquare,
  HiTicket as Ticket,
  HiChartBar as BarChart3,
  HiShieldCheck as Shield,
  HiBookOpen as BookOpen,
  HiCog6Tooth as Settings,
  HiUserGroup as Users,
  HiBell as Bell,
  HiChevronRight as ChevronRight,
  HiChevronDown as ChevronDown,
  HiChevronUp as ChevronUp,
  HiMagnifyingGlass as Search,
  HiArrowUpTray as Upload,
  HiTrash as Trash2,
  HiDocumentText as FileText,
  HiClock as Clock,
  HiExclamationTriangle as AlertTriangle,
  HiCheckCircle as CheckCircle2,
  HiXCircle as XCircle,
  HiArrowPath as Loader2,
  HiArrowRight as ArrowRight,
  HiBolt as Zap,
  HiArrowTrendingUp as TrendingUp,
  HiEye as Eye,
  HiPlus as Plus,
  HiEnvelope as Mail,
  HiPhone as Phone,
  HiBuildingOffice2 as Building2,
  HiUser as User,
  HiCpuChip as Bot,
  HiSparkles as Sparkles,
  HiSignal as Activity,
  HiSquares2X2 as LayoutDashboard,
  HiGlobeAlt as Network,
  HiChevronLeft as ChevronLeft,
  HiXMark as X,
} from 'react-icons/hi2'
const RefreshCw = Loader2

// ─── CONSTANTS ───
const RAG_ID = '699eb6c3e9e49857cb7b961e'
const AGENT_IDS = {
  orchestrator: '699eb700beec997879afcba7',
  resolutionCopilot: '699eb72d97d0e1107b38dc11',
  rootCause: '699eb72d97d0e1107b38dc15',
  complianceRisk: '699eb72e74aabe5228cbfa2c',
  slaPrediction: '699eb72e74aabe5228cbfa30',
}

// ─── TYPES ───
interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: string
  agentData?: any
}

interface TicketData {
  id: string
  subject: string
  category: string
  status: 'open' | 'in-progress' | 'resolved' | 'escalated'
  priority: 'critical' | 'high' | 'medium' | 'low'
  date: string
  description: string
  assignee: string
  department: string
  slaHours: number
  slaDeadline: number
  messages: { role: string; content: string; time: string }[]
}

interface OrgNode {
  id: string
  name: string
  role: string
  department: string
  email: string
  phone: string
  children: OrgNode[]
}

// ─── MOCK DATA ───
const MOCK_TICKETS: TicketData[] = [
  { id: 'TK-1001', subject: 'Leave balance discrepancy for Q4', category: 'Leave', status: 'open', priority: 'high', date: '2026-02-24', description: 'My leave balance shows 5 days but I should have 8 remaining vacation days.', assignee: 'Sarah Mitchell', department: 'Engineering', slaHours: 4, slaDeadline: 24, messages: [{ role: 'employee', content: 'My leave balance shows 5 days but I should have 8 remaining vacation days.', time: '9:00 AM' }, { role: 'hr', content: 'We are reviewing your leave records. Will update shortly.', time: '10:30 AM' }] },
  { id: 'TK-1002', subject: 'Payroll deduction error - February', category: 'Payroll', status: 'escalated', priority: 'critical', date: '2026-02-23', description: 'My February payslip shows an extra deduction of $340 that I cannot identify.', assignee: 'James Cooper', department: 'Sales', slaHours: 18, slaDeadline: 8, messages: [{ role: 'employee', content: 'My payslip has an extra deduction of $340.', time: '8:15 AM' }] },
  { id: 'TK-1003', subject: 'Health insurance enrollment window', category: 'Benefits', status: 'in-progress', priority: 'medium', date: '2026-02-22', description: 'I missed the open enrollment window and need to add my spouse to my plan.', assignee: 'Lisa Park', department: 'Marketing', slaHours: 12, slaDeadline: 48, messages: [{ role: 'employee', content: 'Can I still add my spouse to the health plan?', time: '2:00 PM' }] },
  { id: 'TK-1004', subject: 'VPN access for remote work setup', category: 'IT Access', status: 'open', priority: 'medium', date: '2026-02-24', description: 'Need VPN credentials set up for new remote work arrangement approved by my manager.', assignee: 'David Kim', department: 'Engineering', slaHours: 2, slaDeadline: 24, messages: [] },
  { id: 'TK-1005', subject: 'Onboarding checklist incomplete', category: 'Onboarding', status: 'in-progress', priority: 'high', date: '2026-02-21', description: 'New hire orientation materials not received. Start date is March 1.', assignee: 'Emma Thompson', department: 'Product', slaHours: 48, slaDeadline: 72, messages: [] },
  { id: 'TK-1006', subject: 'Annual compliance training overdue', category: 'Compliance', status: 'escalated', priority: 'critical', date: '2026-02-20', description: '15 employees in the finance department have not completed mandatory compliance training.', assignee: 'HR Team', department: 'Finance', slaHours: 72, slaDeadline: 24, messages: [] },
  { id: 'TK-1007', subject: 'Salary certificate request', category: 'Payroll', status: 'resolved', priority: 'low', date: '2026-02-19', description: 'Need salary certificate for bank loan application.', assignee: 'Mark Johnson', department: 'Operations', slaHours: 6, slaDeadline: 48, messages: [{ role: 'employee', content: 'Can I get a salary certificate?', time: '11:00 AM' }, { role: 'hr', content: 'Certificate generated and sent to your email.', time: '2:00 PM' }] },
  { id: 'TK-1008', subject: 'Work from home policy clarification', category: 'Leave', status: 'resolved', priority: 'low', date: '2026-02-18', description: 'Need clarity on the hybrid work policy for my department.', assignee: 'Rachel Green', department: 'Design', slaHours: 3, slaDeadline: 24, messages: [] },
  { id: 'TK-1009', subject: 'Performance review scheduling conflict', category: 'Compliance', status: 'open', priority: 'medium', date: '2026-02-24', description: 'My performance review is scheduled during a client presentation. Need to reschedule.', assignee: 'Tom Wilson', department: 'Sales', slaHours: 1, slaDeadline: 48, messages: [] },
  { id: 'TK-1010', subject: 'Expense reimbursement delayed', category: 'Payroll', status: 'in-progress', priority: 'high', date: '2026-02-22', description: 'Travel expense claim submitted 3 weeks ago still pending approval.', assignee: 'Nina Patel', department: 'Consulting', slaHours: 20, slaDeadline: 24, messages: [] },
  { id: 'TK-1011', subject: 'Badge access not working - Building B', category: 'IT Access', status: 'open', priority: 'high', date: '2026-02-24', description: 'Cannot access Building B with my badge since the system upgrade last week.', assignee: 'Alex Rivera', department: 'Engineering', slaHours: 3, slaDeadline: 12, messages: [] },
  { id: 'TK-1012', subject: 'Maternity leave documentation', category: 'Leave', status: 'in-progress', priority: 'medium', date: '2026-02-20', description: 'Need to submit documentation for upcoming maternity leave starting April.', assignee: 'Jennifer Lee', department: 'Legal', slaHours: 48, slaDeadline: 72, messages: [] },
  { id: 'TK-1013', subject: 'Tax form W-2 correction needed', category: 'Payroll', status: 'open', priority: 'critical', date: '2026-02-23', description: 'My W-2 form has incorrect state tax withholding amount. Filing deadline approaching.', assignee: 'Robert Chen', department: 'Finance', slaHours: 6, slaDeadline: 12, messages: [] },
  { id: 'TK-1014', subject: 'New team member system provisioning', category: 'Onboarding', status: 'resolved', priority: 'medium', date: '2026-02-17', description: 'Need Slack, Jira, and Confluence access for new team member starting Feb 20.', assignee: 'Chris Adams', department: 'Product', slaHours: 24, slaDeadline: 48, messages: [] },
  { id: 'TK-1015', subject: 'Harassment training not reflecting', category: 'Compliance', status: 'open', priority: 'low', date: '2026-02-24', description: 'Completed the anti-harassment training last week but my profile still shows it as incomplete.', assignee: 'Susan Wright', department: 'HR', slaHours: 2, slaDeadline: 48, messages: [] },
]

const MOCK_ORG: OrgNode = {
  id: 'o1', name: 'Alexandra Sterling', role: 'CEO', department: 'Executive', email: 'a.sterling@lyzr-hr.com', phone: '+1 (555) 100-0001',
  children: [
    {
      id: 'o2', name: 'Michael Torres', role: 'VP Engineering', department: 'Engineering', email: 'm.torres@lyzr-hr.com', phone: '+1 (555) 200-0001',
      children: [
        { id: 'o5', name: 'Sarah Mitchell', role: 'Engineering Manager', department: 'Engineering', email: 's.mitchell@lyzr-hr.com', phone: '+1 (555) 200-0002', children: [
          { id: 'o10', name: 'David Kim', role: 'Senior Engineer', department: 'Engineering', email: 'd.kim@lyzr-hr.com', phone: '+1 (555) 200-0003', children: [] },
          { id: 'o11', name: 'Alex Rivera', role: 'Software Engineer', department: 'Engineering', email: 'a.rivera@lyzr-hr.com', phone: '+1 (555) 200-0004', children: [] },
        ]},
        { id: 'o6', name: 'Priya Sharma', role: 'QA Lead', department: 'Engineering', email: 'p.sharma@lyzr-hr.com', phone: '+1 (555) 200-0005', children: [] },
      ]
    },
    {
      id: 'o3', name: 'Catherine Wu', role: 'VP People & Culture', department: 'HR', email: 'c.wu@lyzr-hr.com', phone: '+1 (555) 300-0001',
      children: [
        { id: 'o7', name: 'James Cooper', role: 'HR Manager', department: 'HR', email: 'j.cooper@lyzr-hr.com', phone: '+1 (555) 300-0002', children: [
          { id: 'o12', name: 'Susan Wright', role: 'HR Specialist', department: 'HR', email: 's.wright@lyzr-hr.com', phone: '+1 (555) 300-0003', children: [] },
        ]},
        { id: 'o8', name: 'Lisa Park', role: 'Benefits Manager', department: 'HR', email: 'l.park@lyzr-hr.com', phone: '+1 (555) 300-0004', children: [] },
      ]
    },
    {
      id: 'o4', name: 'Robert Chen', role: 'VP Finance', department: 'Finance', email: 'r.chen@lyzr-hr.com', phone: '+1 (555) 400-0001',
      children: [
        { id: 'o9', name: 'Nina Patel', role: 'Finance Manager', department: 'Finance', email: 'n.patel@lyzr-hr.com', phone: '+1 (555) 400-0002', children: [
          { id: 'o13', name: 'Tom Wilson', role: 'Financial Analyst', department: 'Finance', email: 't.wilson@lyzr-hr.com', phone: '+1 (555) 400-0003', children: [] },
        ]},
      ]
    },
  ]
}

const SAMPLE_CHAT: ChatMessage[] = [
  { id: 's1', role: 'user', content: 'How many leave days do I have remaining this year?', timestamp: '9:00 AM' },
  { id: 's2', role: 'agent', content: 'Based on your records, you currently have **8 vacation days** and **3 sick days** remaining for 2026. Your next accrual of 1.67 vacation days is on March 1st.\n\nWould you like to apply for leave or see a detailed breakdown?', timestamp: '9:01 AM', agentData: { intent_classification: 'leave_inquiry', domain: 'leave_management', follow_up_suggestions: ['Apply for leave', 'View leave breakdown', 'Check team calendar'] } },
  { id: 's3', role: 'user', content: 'What is the policy for carrying over unused vacation days?', timestamp: '9:05 AM' },
  { id: 's4', role: 'agent', content: '## Vacation Carryover Policy\n\nPer company policy **HR-POL-2024-003**:\n\n- You may carry over up to **5 unused vacation days** into the next calendar year\n- Carried-over days must be used by **March 31st** of the following year\n- Days beyond the 5-day limit will be forfeited unless approved by your department VP\n- Sick days do **not** carry over\n\nWould you like me to help you plan your remaining days?', timestamp: '9:06 AM', agentData: { intent_classification: 'policy_inquiry', domain: 'leave_management', actions_taken: [{ agent: 'Policy Retrieval', action: 'search_policy', result: 'Found HR-POL-2024-003' }], follow_up_suggestions: ['Plan remaining days', 'Request VP approval for extra carryover', 'Download policy document'] } },
]

// ─── AGENT INFO ───
const AGENTS_INFO: Record<string, { name: string; purpose: string; steps: string[] }> = {
  [AGENT_IDS.orchestrator]: { name: 'HR Orchestrator', purpose: 'Employee concierge -- routes queries to sub-agents', steps: ['Classifying intent', 'Routing to sub-agents', 'Policy Retrieval searching KB', 'Action Execution processing', 'Sentiment analysis running', 'Aggregating responses'] },
  [AGENT_IDS.resolutionCopilot]: { name: 'Resolution Copilot', purpose: 'AI-powered ticket resolution suggestions', steps: ['Analyzing ticket context', 'Searching knowledge base', 'Drafting response', 'Finding precedent cases', 'Generating resolution steps'] },
  [AGENT_IDS.rootCause]: { name: 'Root Cause Analyst', purpose: 'Pattern analysis across HR tickets', steps: ['Scanning ticket history', 'Identifying recurring patterns', 'Mapping department impact', 'Evaluating automation potential', 'Prioritizing actions'] },
  [AGENT_IDS.complianceRisk]: { name: 'Compliance Risk Scanner', purpose: 'Identifies compliance and legal risks', steps: ['Scanning active tickets', 'Cross-referencing policies', 'Evaluating legal exposure', 'Classifying risk severity', 'Generating risk summary'] },
  [AGENT_IDS.slaPrediction]: { name: 'SLA Predictor', purpose: 'Predicts SLA breach risk for open tickets', steps: ['Analyzing ticket age', 'Assessing complexity', 'Checking workload distribution', 'Calculating breach probability', 'Generating recommendations'] },
}

// ─── Agent Thinking Orchestration Bar (one-line, for non-concierge screens) ───
function AgentThinkingBar({ activeAgentId }: { activeAgentId: string | null }) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (!activeAgentId) { setStepIndex(0); return }
    const interval = setInterval(() => {
      setStepIndex(prev => prev + 1)
    }, 2200)
    return () => clearInterval(interval)
  }, [activeAgentId])

  if (!activeAgentId) return null

  const agent = AGENTS_INFO[activeAgentId]
  if (!agent) return null

  const currentStep = agent.steps[stepIndex % agent.steps.length]

  return (
    <div className="w-full glass-thinking px-4 py-1.5 flex items-center gap-3 overflow-hidden">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="relative flex items-center justify-center w-4 h-4">
          <span className="absolute inline-flex h-full w-full rounded-full bg-accent/40 animate-ping" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
        </div>
        <span className="text-xs font-semibold text-primary whitespace-nowrap">{agent.name}</span>
      </div>
      <Separator orientation="vertical" className="h-4 bg-primary/20" />
      <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
        <Loader2 className="w-3 h-3 animate-spin text-accent flex-shrink-0" />
        <span className="text-xs text-muted-foreground truncate animate-pulse">{currentStep}...</span>
      </div>
      <div className="ml-auto flex gap-0.5 flex-shrink-0">
        {agent.steps.map((_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= (stepIndex % agent.steps.length) ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>
    </div>
  )
}

// ─── Sub-agent definitions for orchestration visualization ───
const ORCHESTRATOR_SUB_AGENTS = [
  { id: 'classify', name: 'Intent Classifier', icon: 'search', description: 'Analyzing query intent & domain', duration: 2000 },
  { id: 'route', name: 'Router', icon: 'route', description: 'Selecting specialized sub-agents', duration: 1200 },
  { id: 'policy', name: 'Policy Retrieval', icon: 'book', description: 'Searching HR knowledge base', duration: 3000 },
  { id: 'action', name: 'Action Execution', icon: 'zap', description: 'Processing requested actions', duration: 2500 },
  { id: 'sentiment', name: 'Sentiment Analysis', icon: 'activity', description: 'Evaluating tone & urgency', duration: 1800 },
  { id: 'aggregate', name: 'Response Aggregator', icon: 'sparkles', description: 'Composing final response', duration: 2000 },
]

function SubAgentIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'search': return <Search className={className} />
    case 'route': return <Network className={className} />
    case 'book': return <BookOpen className={className} />
    case 'zap': return <Zap className={className} />
    case 'activity': return <Activity className={className} />
    case 'sparkles': return <Sparkles className={className} />
    default: return <Bot className={className} />
  }
}

// ─── Inline Orchestration Visualization (chat-embedded) ───
function InlineChatOrchestration({ onScrollNeeded }: { onScrollNeeded?: () => void }) {
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  useEffect(() => {
    let currentStep = 0
    const advanceStep = () => {
      if (currentStep >= ORCHESTRATOR_SUB_AGENTS.length) return

      setActiveStep(currentStep)
      onScrollNeeded?.()

      const duration = ORCHESTRATOR_SUB_AGENTS[currentStep].duration
      const completeTimeout = setTimeout(() => {
        setCompletedSteps(prev => {
          const next = new Set(prev)
          next.add(currentStep)
          return next
        })
        currentStep++
        if (currentStep < ORCHESTRATOR_SUB_AGENTS.length) {
          const nextTimeout = setTimeout(advanceStep, 300)
          timeouts.push(nextTimeout)
        }
      }, duration)
      timeouts.push(completeTimeout)
    }

    const timeouts: ReturnType<typeof setTimeout>[] = []
    advanceStep()

    return () => { timeouts.forEach(t => clearTimeout(t)) }
  }, [onScrollNeeded])

  const getStepStatus = (index: number): 'pending' | 'active' | 'completed' => {
    if (completedSteps.has(index)) return 'completed'
    if (index === activeStep) return 'active'
    return 'pending'
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div className="glass-chat-agent rounded-2xl p-4 max-w-[420px]">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex items-center justify-center w-4 h-4">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent/40 animate-ping" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
            </div>
            <span className="text-xs font-semibold text-primary">HR Orchestrator</span>
            <span className="text-[10px] text-muted-foreground">Processing query...</span>
          </div>

          {/* Sub-agent pipeline */}
          <div className="space-y-1.5">
            {ORCHESTRATOR_SUB_AGENTS.map((agent, index) => {
              const status = getStepStatus(index)
              return (
                <div
                  key={agent.id}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all duration-500 ${
                    status === 'active'
                      ? 'glass-heavy border-accent/30 shadow-sm'
                      : status === 'completed'
                      ? 'bg-green-50/60 border border-green-200/40'
                      : 'glass-light opacity-50'
                  }`}
                >
                  {/* Status icon */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    status === 'active'
                      ? 'bg-accent/20'
                      : status === 'completed'
                      ? 'bg-green-100'
                      : 'bg-muted/50'
                  }`}>
                    {status === 'active' ? (
                      <Loader2 className="w-3 h-3 animate-spin text-accent" />
                    ) : status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                    ) : (
                      <SubAgentIcon type={agent.icon} className="w-2.5 h-2.5 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Agent info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-semibold transition-colors ${
                        status === 'active' ? 'text-primary' : status === 'completed' ? 'text-green-700' : 'text-muted-foreground'
                      }`}>
                        {agent.name}
                      </span>
                    </div>
                    {status === 'active' && (
                      <p className="text-[10px] text-muted-foreground animate-pulse truncate">{agent.description}</p>
                    )}
                  </div>

                  {/* Connector line to next */}
                  {status === 'active' && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      <span className="w-1 h-1 bg-accent rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((completedSteps.size) / ORCHESTRATOR_SUB_AGENTS.length) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{completedSteps.size}/{ORCHESTRATOR_SUB_AGENTS.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── HELPERS ───
const parseAgentResponse = (result: any) => {
  try {
    const response = result?.response
    if (!response) return null
    let data = response.result
    if (typeof data === 'string') {
      try { data = JSON.parse(data) } catch { return { text: data } }
    }
    if (data && typeof data === 'object' && 'response' in data) {
      data = data.response
    }
    return data
  } catch { return null }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function getStatusColor(status: string) {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-700'
    case 'in-progress': return 'bg-yellow-100 text-yellow-700'
    case 'resolved': return 'bg-green-100 text-green-700'
    case 'escalated': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'critical': return 'bg-red-500 text-white'
    case 'high': return 'bg-orange-500 text-white'
    case 'medium': return 'bg-yellow-500 text-white'
    case 'low': return 'bg-green-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

// ─── DATE FILTER COMPONENT ───
const DATE_RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: 'all', label: 'All Time' },
]

function DateRangeFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      {DATE_RANGES.map(r => (
        <button key={r.id} onClick={() => onChange(r.id)} className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium ${value === r.id ? 'glass-nav-active text-primary-foreground shadow-sm' : 'glass-light text-foreground hover:bg-white/50'}`}>
          {r.label}
        </button>
      ))}
    </div>
  )
}

// ─── ERROR BOUNDARY ───
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm glass-btn">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── SCREEN: Employee AI Concierge Chat ───
function EmployeeConciergeScreen({ sampleMode, activeAgentId, setActiveAgentId }: { sampleMode: boolean; activeAgentId: string | null; setActiveAgentId: (id: string | null) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sampleMode) setMessages(SAMPLE_CHAT)
    else setMessages([])
  }, [sampleMode])

  const scrollToBottom = useRef(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }).current

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  const quickActions = ['Apply Leave', 'View Payslip', 'Raise IT Request', 'Salary Certificate']

  const handleSend = async (text?: string) => {
    const msg = text || input
    if (!msg.trim()) return
    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: msg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setActiveAgentId(AGENT_IDS.orchestrator)
    try {
      const result = await callAIAgent(msg, AGENT_IDS.orchestrator)
      const data = parseAgentResponse(result)
      const responseText = data?.response_message ?? data?.text ?? result?.response?.message ?? 'I received your request and am processing it.'
      const agentMsg: ChatMessage = { id: generateId(), role: 'agent', content: responseText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), agentData: data }
      setMessages(prev => [...prev, agentMsg])
    } catch {
      setMessages(prev => [...prev, { id: generateId(), role: 'agent', content: 'Sorry, I encountered an issue. Please try again.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    }
    setLoading(false)
    setActiveAgentId(null)
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-white/30">
          <h2 className="font-serif text-2xl font-semibold">AI Concierge</h2>
          <p className="text-sm text-muted-foreground">Your personal HR assistant -- ask anything about policies, leave, payroll, and more</p>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !sampleMode && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Bot className="w-8 h-8 text-primary" /></div>
              <h3 className="font-serif text-xl font-semibold mb-2">Welcome to Lyzr HR Assistant</h3>
              <p className="text-muted-foreground text-sm max-w-sm">Ask me about leave policies, payroll, benefits, IT requests, or anything HR-related. I am here to help.</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                <div className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className={`rounded-2xl p-3 ${msg.role === 'user' ? 'glass-chat-user text-primary-foreground' : 'glass-chat-agent'}`}>
                      {msg.role === 'user' ? <p className="text-sm">{msg.content}</p> : renderMarkdown(msg.content)}
                    </div>
                    {msg.agentData?.actions_taken && Array.isArray(msg.agentData.actions_taken) && msg.agentData.actions_taken.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.agentData.actions_taken.map((action: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs glass-light rounded-lg px-2 py-1">
                            <Zap className="w-3 h-3 text-accent" />
                            <span className="text-muted-foreground">{action?.agent}: {action?.result}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.agentData?.escalation_triggered && (
                      <div className="mt-2 flex items-center gap-2 text-xs bg-red-50 text-red-700 rounded px-2 py-1 border border-red-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span>This query has been escalated to an HR specialist</span>
                      </div>
                    )}
                    {msg.agentData?.follow_up_suggestions && Array.isArray(msg.agentData.follow_up_suggestions) && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {msg.agentData.follow_up_suggestions.map((s: string, i: number) => (
                          <button key={i} onClick={() => handleSend(s)} className="text-xs glass-light hover:bg-white/50 text-foreground font-medium rounded-full px-3 py-1 transition-all">{s}</button>
                        ))}
                      </div>
                    )}
                    <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'} text-muted-foreground`}>{msg.timestamp}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <InlineChatOrchestration onScrollNeeded={scrollToBottom} />
          )}
        </div>
        <div className="p-4 border-t border-white/30 glass-header">
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Lyzr HR Assistant anything..." className="flex-1" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} disabled={loading} />
            <Button onClick={() => handleSend()} disabled={loading || !input.trim()} className="bg-primary text-primary-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
      {showQuickActions && (
        <div className="w-56 border-l border-white/30 p-4 hidden lg:block glass-panel">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-serif text-sm font-semibold">Quick Actions</h4>
            <button onClick={() => setShowQuickActions(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="space-y-2">
            {quickActions.map(action => (
              <button key={action} onClick={() => handleSend(action)} className="w-full text-left text-sm glass-light rounded-xl px-3 py-2 transition-all hover:bg-white/50 text-foreground font-medium flex items-center gap-2">
                <ArrowRight className="w-3 h-3 text-primary" />{action}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SCREEN: Employee My Tickets ───
function EmployeeTicketsScreen({ sampleMode }: { sampleMode: boolean }) {
  const [filter, setFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [userTickets, setUserTickets] = useState<TicketData[]>([])
  const [replyText, setReplyText] = useState('')

  // New ticket form state
  const [newSubject, setNewSubject] = useState('')
  const [newCategory, setNewCategory] = useState('Leave')
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [newDescription, setNewDescription] = useState('')

  const baseTickets = sampleMode ? MOCK_TICKETS.slice(0, 8) : []
  const tickets = [...userTickets, ...baseTickets]
  const filters = ['all', 'open', 'in-progress', 'resolved', 'escalated']
  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  const categories = ['Leave', 'Payroll', 'Benefits', 'IT Access', 'Onboarding', 'Compliance', 'Other']

  const handleCreateTicket = () => {
    if (!newSubject.trim() || !newDescription.trim()) return
    const newTicket: TicketData = {
      id: `TK-${2000 + userTickets.length + 1}`,
      subject: newSubject.trim(),
      category: newCategory,
      status: 'open',
      priority: newPriority,
      date: new Date().toISOString().split('T')[0],
      description: newDescription.trim(),
      assignee: 'Pending Assignment',
      department: 'Employee',
      slaHours: 0,
      slaDeadline: newPriority === 'critical' ? 8 : newPriority === 'high' ? 24 : 48,
      messages: [{ role: 'employee', content: newDescription.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
    }
    setUserTickets(prev => [newTicket, ...prev])
    setNewSubject('')
    setNewCategory('Leave')
    setNewPriority('medium')
    setNewDescription('')
    setShowCreateDialog(false)
    setSelectedTicket(newTicket)
  }

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicket) return
    const newMessage = { role: 'employee', content: replyText.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    const updatedTicket = { ...selectedTicket, messages: [...(selectedTicket.messages || []), newMessage] }
    setSelectedTicket(updatedTicket)
    // Update in userTickets if it's a user-created ticket
    setUserTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t))
    setReplyText('')
  }

  return (
    <div className="flex h-full">
      <div className={`${selectedTicket ? 'w-1/2' : 'w-full'} flex flex-col`}>
        <div className="p-4 border-b border-white/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold">My Tickets</h2>
              <p className="text-sm text-muted-foreground">Track your HR requests and their status</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-primary text-primary-foreground" size="sm">
              <Plus className="w-4 h-4 mr-1" />New Ticket
            </Button>
          </div>
        </div>
        <div className="p-4 border-b border-white/30">
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-sm rounded-full capitalize transition-all font-medium ${filter === f ? 'glass-nav-active text-primary-foreground' : 'glass-light text-foreground hover:bg-white/50'}`}>{f === 'in-progress' ? 'In Progress' : f}</button>
            ))}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Ticket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">{sampleMode || userTickets.length > 0 ? 'No tickets match this filter' : 'No tickets yet -- create one to get started!'}</p>
                {!sampleMode && userTickets.length === 0 && (
                  <Button onClick={() => setShowCreateDialog(true)} variant="outline" size="sm" className="mt-3">
                    <Plus className="w-3 h-3 mr-1" />Create Your First Ticket
                  </Button>
                )}
              </div>
            )}
            {filtered.map(ticket => (
              <button key={ticket.id} onClick={() => { setSelectedTicket(ticket); setReplyText('') }} className={`w-full text-left p-4 rounded-xl transition-all hover:shadow-lg ${selectedTicket?.id === ticket.id ? 'glass-heavy border-primary/30 shadow-lg' : 'glass-light hover:bg-white/50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">{ticket.id}</span>
                      <Badge className={`text-[10px] ${getStatusColor(ticket.status)}`}>{ticket.status}</Badge>
                      <Badge className={`text-[10px] ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{ticket.category}</span>
                      <span>{ticket.date}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2" />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Ticket Detail Panel with Reply */}
      {selectedTicket && (
        <div className="w-1/2 border-l border-white/30 flex flex-col glass-panel">
          <div className="p-4 border-b border-white/30 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold">{selectedTicket.subject}</h3>
              <p className="text-xs text-muted-foreground">{selectedTicket.id} -- {selectedTicket.category}</p>
            </div>
            <button onClick={() => setSelectedTicket(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
                <Badge className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                <Badge variant="outline">{selectedTicket.department}</Badge>
              </div>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <p className="text-sm">{selectedTicket.description}</p>
                </CardContent>
              </Card>
              <div>
                <h4 className="font-serif text-sm font-semibold mb-2">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{selectedTicket.date}</p>
                      <p className="text-sm">Ticket created</p>
                    </div>
                  </div>
                  {Array.isArray(selectedTicket.messages) && selectedTicket.messages.map((m, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${m.role === 'hr' ? 'bg-accent' : 'bg-primary'}`} />
                      <div>
                        <p className="text-xs text-muted-foreground">{m.time} -- {m.role === 'hr' ? 'HR Team' : 'You'}</p>
                        <p className="text-sm">{m.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">SLA: {selectedTicket.slaDeadline}h deadline / {selectedTicket.slaHours}h elapsed</span>
              </div>
              <Separator className="bg-primary/10" />
              {/* Reply Section */}
              <div>
                <h4 className="font-serif text-sm font-semibold mb-2">Add a Reply</h4>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message or provide additional details..."
                  className="min-h-[80px] text-sm resize-none glass-input rounded-xl"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">{replyText.length > 0 ? `${replyText.length} characters` : 'Add more info or follow up on this ticket'}</p>
                  <Button onClick={handleSendReply} disabled={!replyText.trim()} size="sm" className="bg-primary text-primary-foreground">
                    <Send className="w-3 h-3 mr-1" />Send Reply
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="glass-dialog rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Create New Ticket</DialogTitle>
            <DialogDescription>Submit a new HR request or report an issue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Subject</Label>
              <Input
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Brief summary of your request..."
                className="glass-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Category</Label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border text-sm bg-white/50 backdrop-blur-sm border-white/50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Priority</Label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                  className="w-full h-9 px-3 rounded-xl border text-sm bg-white/50 backdrop-blur-sm border-white/50 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Description</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe your issue or request in detail..."
                className="min-h-[120px] text-sm resize-none glass-input rounded-xl"
                rows={5}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} size="sm">Cancel</Button>
              <Button onClick={handleCreateTicket} disabled={!newSubject.trim() || !newDescription.trim()} size="sm" className="bg-primary text-primary-foreground">
                <Plus className="w-3 h-3 mr-1" />Create Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── SCREEN: Employee Org Chart (Visual Tree) ───
function OrgTreeNode({ node, onSelect, selectedId, searchTerm }: { node: OrgNode; onSelect: (n: OrgNode) => void; selectedId: string | null; searchTerm: string }) {
  const hasChildren = node.children.length > 0
  const initials = node.name.split(' ').map(n => n[0]).join('')
  const isSelected = selectedId === node.id

  const matchesSearch = (n: OrgNode): boolean => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return n.name.toLowerCase().includes(term) || n.role.toLowerCase().includes(term) || n.department.toLowerCase().includes(term)
  }

  const nodeMatches = matchesSearch(node)
  const anyChildMatches = (n: OrgNode): boolean => {
    return matchesSearch(n) || n.children.some(c => anyChildMatches(c))
  }
  const childrenMatch = node.children.some(c => anyChildMatches(c))

  if (searchTerm && !nodeMatches && !childrenMatch) return null

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'Executive': return 'from-primary to-primary/80'
      case 'Engineering': return 'from-blue-600 to-blue-500'
      case 'HR': return 'from-purple-600 to-purple-500'
      case 'Finance': return 'from-green-600 to-green-500'
      default: return 'from-primary to-primary/80'
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <button
        onClick={() => onSelect(node)}
        className={`relative glass-card rounded-2xl p-3 w-44 text-center transition-all hover:shadow-lg hover:-translate-y-0.5 ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''} ${searchTerm && nodeMatches ? 'ring-2 ring-accent' : ''}`}
      >
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getDeptColor(node.department)} flex items-center justify-center text-white text-sm font-bold mx-auto mb-2 shadow-md`}>
          {initials}
        </div>
        <p className="text-sm font-semibold text-foreground truncate">{node.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{node.role}</p>
        <Badge variant="outline" className="text-[9px] mt-1.5 bg-white/30">{node.department}</Badge>
      </button>

      {/* Connector line down from parent to children */}
      {hasChildren && (
        <>
          {/* Vertical line from parent down */}
          <div className="w-px h-6 bg-primary/25" />

          {/* Horizontal bar spanning all children */}
          {node.children.length > 1 && (
            <div className="relative w-full flex justify-center">
              <div className="h-px bg-primary/25" style={{ width: `${Math.max((node.children.filter(c => !searchTerm || anyChildMatches(c)).length - 1) * 192, 0)}px` }} />
            </div>
          )}

          {/* Children row */}
          <div className="flex items-start gap-4 pt-0">
            {node.children.map(child => {
              if (searchTerm && !anyChildMatches(child)) return null
              return (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Vertical line from horizontal bar to child */}
                  <div className="w-px h-6 bg-primary/25" />
                  <OrgTreeNode
                    node={child}
                    onSelect={onSelect}
                    selectedId={selectedId}
                    searchTerm={searchTerm}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function EmployeeOrgChartScreen({ sampleMode }: { sampleMode: boolean }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null)

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-white/30">
          <h2 className="font-serif text-2xl font-semibold">Organization Chart</h2>
          <p className="text-sm text-muted-foreground">Explore the company hierarchy and find colleagues</p>
        </div>
        <div className="p-4 border-b border-white/30">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, role, or department..." className="pl-9" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-8 flex justify-center min-w-max">
            {sampleMode ? (
              <OrgTreeNode
                node={MOCK_ORG}
                onSelect={setSelectedNode}
                selectedId={selectedNode?.id ?? null}
                searchTerm={searchTerm}
              />
            ) : (
              <div className="text-center py-12">
                <Network className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Enable sample data to view the org chart</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      {selectedNode && (
        <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
          <DialogContent className="glass-dialog rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">{selectedNode.name}</DialogTitle>
              <DialogDescription>{selectedNode.role}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{selectedNode.department}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><a href={`mailto:${selectedNode.email}`} className="text-sm text-primary hover:underline">{selectedNode.email}</a></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{selectedNode.phone}</span></div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ─── SCREEN: HR Overview Dashboard ───
function HROverviewDashboardScreen({ sampleMode, activeAgentId, setActiveAgentId, onNavigate }: { sampleMode: boolean; activeAgentId: string | null; setActiveAgentId: (id: string | null) => void; onNavigate: (screen: string) => void }) {
  const [dateRange, setDateRange] = useState('30d')
  const tickets = sampleMode ? MOCK_TICKETS : []
  const openCount = tickets.filter(t => t.status === 'open').length
  const inProgressCount = tickets.filter(t => t.status === 'in-progress').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length
  const escalatedCount = tickets.filter(t => t.status === 'escalated').length
  const criticalTickets = tickets.filter(t => t.priority === 'critical' || t.priority === 'high')
  const recentTickets = tickets.slice(0, 5)

  const overviewMetrics = [
    { label: 'Total Tickets', value: tickets.length.toString(), icon: Ticket, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Open', value: openCount.toString(), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'In Progress', value: inProgressCount.toString(), icon: Loader2, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Resolved', value: resolvedCount.toString(), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Escalated', value: escalatedCount.toString(), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  const teamWorkload = [
    { name: 'Sarah Mitchell', tickets: 4, dept: 'Engineering' },
    { name: 'James Cooper', tickets: 3, dept: 'HR' },
    { name: 'Lisa Park', tickets: 2, dept: 'Benefits' },
    { name: 'HR Team', tickets: 3, dept: 'General' },
    { name: 'Unassigned', tickets: 3, dept: '--' },
  ]

  const categoryBreakdown = [
    { label: 'Leave', count: tickets.filter(t => t.category === 'Leave').length, color: 'bg-blue-500' },
    { label: 'Payroll', count: tickets.filter(t => t.category === 'Payroll').length, color: 'bg-green-500' },
    { label: 'Benefits', count: tickets.filter(t => t.category === 'Benefits').length, color: 'bg-purple-500' },
    { label: 'IT Access', count: tickets.filter(t => t.category === 'IT Access').length, color: 'bg-orange-500' },
    { label: 'Compliance', count: tickets.filter(t => t.category === 'Compliance').length, color: 'bg-red-500' },
    { label: 'Onboarding', count: tickets.filter(t => t.category === 'Onboarding').length, color: 'bg-teal-500' },
  ]
  const maxCat = Math.max(...categoryBreakdown.map(c => c.count), 1)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/30">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">HR operations overview and quick actions</p>
          </div>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Metric Cards */}
          {sampleMode ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {overviewMetrics.map(m => (
                <Card key={m.label} className="glass-metric shimmer">
                  <CardContent className="p-4">
                    <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center mb-2`}>
                      <m.icon className={`w-5 h-5 ${m.color}`} />
                    </div>
                    <p className="text-2xl font-bold font-serif">{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <LayoutDashboard className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">Enable sample data to view the dashboard</p>
            </div>
          )}

          {sampleMode && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Critical / High Priority Tickets */}
              <Card className="lg:col-span-2 glass-card">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-serif flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" />Priority Tickets</CardTitle>
                    <Button onClick={() => onNavigate('tickets')} variant="outline" size="sm" className="text-xs">View All Tickets <ArrowRight className="w-3 h-3 ml-1" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {criticalTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No critical or high priority tickets</p>
                  ) : (
                    <div className="space-y-2">
                      {criticalTickets.map(ticket => (
                        <div key={ticket.id} className="flex items-center gap-3 p-2.5 rounded-xl glass-light hover:bg-white/50 transition-all">
                          <Badge className={`text-[9px] px-1.5 py-0 ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ticket.subject}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">{ticket.id}</span>
                              <Badge className={`text-[9px] px-1.5 py-0 ${getStatusColor(ticket.status)}`}>{ticket.status}</Badge>
                              <span>{ticket.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            <span>{ticket.slaHours}h / {ticket.slaDeadline}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="glass-card">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-serif">By Category</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-2.5">
                    {categoryBreakdown.map(c => (
                      <div key={c.label} className="flex items-center gap-2">
                        <span className="text-xs w-16 text-muted-foreground truncate">{c.label}</span>
                        <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${c.color} rounded-full transition-all`} style={{ width: `${(c.count / maxCat) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium w-5 text-right">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {sampleMode && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* AI Quick Actions */}
              <Card className="glass-card">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-serif flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" />AI Quick Actions</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onNavigate('analytics')} className="p-3 rounded-xl glass-light hover:bg-white/50 transition-all text-left">
                      <TrendingUp className="w-5 h-5 text-primary mb-1.5" />
                      <p className="text-sm font-semibold text-foreground">Analyze Patterns</p>
                      <p className="text-xs text-muted-foreground">Root cause analysis</p>
                    </button>
                    <button onClick={() => onNavigate('analytics')} className="p-3 rounded-xl glass-light hover:bg-white/50 transition-all text-left">
                      <Clock className="w-5 h-5 text-primary mb-1.5" />
                      <p className="text-sm font-semibold text-foreground">Predict Breaches</p>
                      <p className="text-xs text-muted-foreground">SLA risk forecast</p>
                    </button>
                    <button onClick={() => onNavigate('compliance')} className="p-3 rounded-xl glass-light hover:bg-white/50 transition-all text-left">
                      <Shield className="w-5 h-5 text-primary mb-1.5" />
                      <p className="text-sm font-semibold text-foreground">Scan Risks</p>
                      <p className="text-xs text-muted-foreground">Compliance check</p>
                    </button>
                    <button onClick={() => onNavigate('tickets')} className="p-3 rounded-xl glass-light hover:bg-white/50 transition-all text-left">
                      <Bot className="w-5 h-5 text-primary mb-1.5" />
                      <p className="text-sm font-semibold text-foreground">AI Copilot</p>
                      <p className="text-xs text-muted-foreground">Ticket resolution</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Team Workload */}
              <Card className="glass-card">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-serif flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Team Workload</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="space-y-2.5">
                    {teamWorkload.map(member => (
                      <div key={member.name} className="flex items-center gap-3 p-2 rounded-xl glass-light">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                          {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.dept}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{member.tickets} tickets</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          {sampleMode && (
            <Card className="glass-card">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-serif">Recent Tickets</CardTitle>
                  <Button onClick={() => onNavigate('tickets')} variant="outline" size="sm" className="text-xs">View All <ArrowRight className="w-3 h-3 ml-1" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="divide-y divide-primary/5">
                  {recentTickets.map(ticket => (
                    <div key={ticket.id} className="flex items-center gap-3 py-2.5">
                      <span className="text-xs font-mono text-muted-foreground w-16">{ticket.id}</span>
                      <p className="text-sm flex-1 truncate">{ticket.subject}</p>
                      <Badge className={`text-[9px] px-1.5 py-0 ${getStatusColor(ticket.status)}`}>{ticket.status}</Badge>
                      <Badge className={`text-[9px] px-1.5 py-0 ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                      <span className="text-xs text-muted-foreground w-20 text-right">{ticket.date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── SCREEN: HR Ticket Dashboard ───
function HRTicketDashboardScreen({ sampleMode, activeAgentId, setActiveAgentId }: { sampleMode: boolean; activeAgentId: string | null; setActiveAgentId: (id: string | null) => void }) {
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateRange, setDateRange] = useState('30d')
  const [copilotResult, setCopilotResult] = useState<any>(null)
  const [copilotLoading, setCopilotLoading] = useState(false)
  const [copilotError, setCopilotError] = useState('')
  const [replyText, setReplyText] = useState('')

  const tickets = sampleMode ? MOCK_TICKETS : []
  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      return t.subject.toLowerCase().includes(s) || t.id.toLowerCase().includes(s) || t.category.toLowerCase().includes(s)
    }
    return true
  }).sort((a, b) => {
    const prio = { critical: 0, high: 1, medium: 2, low: 3 }
    return (prio[a.priority] ?? 4) - (prio[b.priority] ?? 4)
  })

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicket) return
    const newMessage = { role: 'hr', content: replyText.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setSelectedTicket({ ...selectedTicket, messages: [...(selectedTicket.messages || []), newMessage] })
    setReplyText('')
  }

  const handleGetSuggestion = async () => {
    if (!selectedTicket) return
    setCopilotLoading(true)
    setCopilotError('')
    setCopilotResult(null)
    setActiveAgentId(AGENT_IDS.resolutionCopilot)
    try {
      const msg = `Ticket ${selectedTicket.id}: ${selectedTicket.subject}\nCategory: ${selectedTicket.category}\nPriority: ${selectedTicket.priority}\nDescription: ${selectedTicket.description}`
      const result = await callAIAgent(msg, AGENT_IDS.resolutionCopilot)
      const data = parseAgentResponse(result)
      setCopilotResult(data)
    } catch {
      setCopilotError('Failed to get AI suggestion. Please try again.')
    }
    setCopilotLoading(false)
    setActiveAgentId(null)
  }

  return (
    <div className="flex h-full">
      {/* Left: Ticket List */}
      <div className="w-80 border-r border-white/30 flex flex-col flex-shrink-0 glass-panel">
        <div className="p-3 border-b border-white/30">
          <h2 className="font-serif text-lg font-semibold mb-2">Tickets</h2>
          <div className="mb-2"><DateRangeFilter value={dateRange} onChange={setDateRange} /></div>
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="pl-8 h-8 text-sm" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {['all', 'open', 'in-progress', 'escalated', 'resolved'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-2 py-0.5 text-[10px] rounded-full capitalize transition-all font-medium ${statusFilter === s ? 'glass-nav-active text-primary-foreground' : 'glass-light text-foreground hover:bg-white/50'}`}>{s === 'in-progress' ? 'Progress' : s}</button>
            ))}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tickets found</p>
            ) : filtered.map(ticket => (
              <button key={ticket.id} onClick={() => { setSelectedTicket(ticket); setCopilotResult(null); setCopilotError(''); setReplyText('') }} className={`w-full text-left p-2.5 rounded-xl transition-all text-sm ${selectedTicket?.id === ticket.id ? 'glass-heavy border-white/40 shadow-md' : 'hover:bg-white/50 border border-transparent'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground">{ticket.id}</span>
                  <Badge className={`text-[9px] px-1.5 py-0 ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                </div>
                <p className="text-sm font-medium truncate">{ticket.subject}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`text-[9px] px-1.5 py-0 ${getStatusColor(ticket.status)}`}>{ticket.status}</Badge>
                  <span className="text-[10px] text-muted-foreground">{ticket.category}</span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center: Ticket Detail */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b border-white/30">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-lg font-semibold">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground font-mono">{selectedTicket.id}</span>
                    <Badge className={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
                    <Badge className={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
                  </div>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm"><span className="text-muted-foreground">Category:</span> <span className="font-medium">{selectedTicket.category}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Department:</span> <span className="font-medium">{selectedTicket.department}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Assignee:</span> <span className="font-medium">{selectedTicket.assignee}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Created:</span> <span className="font-medium">{selectedTicket.date}</span></div>
                </div>
                <Separator className="bg-primary/10" />
                <div>
                  <h4 className="font-serif text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm glass-light p-3 rounded-xl">{selectedTicket.description}</p>
                </div>
                <div>
                  <h4 className="font-serif text-sm font-semibold mb-2">Conversation</h4>
                  {Array.isArray(selectedTicket.messages) && selectedTicket.messages.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTicket.messages.map((m, i) => (
                        <div key={i} className={`p-3 rounded-xl text-sm ${m.role === 'hr' ? 'glass-light border-accent/20 ml-6' : 'glass-card mr-6'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-xs">{m.role === 'hr' ? 'HR Team' : 'Employee'}</span>
                            <span className="text-xs text-muted-foreground">{m.time}</span>
                          </div>
                          <p>{m.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No conversation yet</p>
                  )}
                </div>
                <div className="flex items-center gap-2 p-3 glass-light rounded-xl">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">SLA: {selectedTicket.slaHours}h elapsed of {selectedTicket.slaDeadline}h deadline</span>
                  <Progress value={Math.min((selectedTicket.slaHours / selectedTicket.slaDeadline) * 100, 100)} className="flex-1 h-2" />
                </div>
                <Separator className="bg-primary/10" />
                <div>
                  <h4 className="font-serif text-sm font-semibold mb-2">Reply</h4>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to the employee..."
                    className="min-h-[80px] text-sm resize-none glass-input rounded-xl"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">{replyText.length > 0 ? `${replyText.length} characters` : 'Use AI Copilot to draft a reply'}</p>
                    <Button onClick={handleSendReply} disabled={!replyText.trim()} size="sm" className="bg-primary text-primary-foreground">
                      <Send className="w-3 h-3 mr-1" />Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Select a ticket to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: AI Assistant */}
      <div className="w-80 border-l border-white/30 flex flex-col flex-shrink-0 glass-panel">
        <div className="p-3 border-b border-white/30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <h3 className="font-serif text-sm font-semibold">AI Resolution Copilot</h3>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {!selectedTicket && (
              <p className="text-sm text-muted-foreground text-center py-8">Select a ticket to get AI suggestions</p>
            )}
            {selectedTicket && !copilotResult && !copilotLoading && !copilotError && (
              <div className="text-center py-6">
                <Bot className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Get AI-powered resolution suggestions</p>
                <Button onClick={handleGetSuggestion} className="bg-primary text-primary-foreground" size="sm">
                  <Sparkles className="w-3 h-3 mr-1" />Get AI Suggestion
                </Button>
              </div>
            )}
            {copilotLoading && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing ticket...</p>
              </div>
            )}
            {copilotError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                <p>{copilotError}</p>
                <Button onClick={handleGetSuggestion} size="sm" variant="outline" className="mt-2">Retry</Button>
              </div>
            )}
            {copilotResult && (
              <div className="space-y-3">
                {copilotResult.drafted_reply && (
                  <Card className="glass-card">
                    <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-serif">Drafted Reply</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-1">
                      {renderMarkdown(copilotResult.drafted_reply)}
                      <Button onClick={() => setReplyText(copilotResult.drafted_reply)} size="sm" variant="outline" className="w-full mt-2 text-xs bg-primary/10 border-primary/30 text-primary font-semibold hover:bg-primary/20 glass-btn rounded-xl">
                        <ArrowRight className="w-3 h-3 mr-1" />Use This Reply
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {copilotResult.resolution_steps && Array.isArray(copilotResult.resolution_steps) && (
                  <Card className="glass-card">
                    <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-serif">Resolution Steps</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-1">
                      <ol className="space-y-1">
                        {copilotResult.resolution_steps.map((step: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}
                {copilotResult.compliance_notes && (
                  <Card className="glass-card">
                    <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-serif">Compliance Notes</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-1">{renderMarkdown(copilotResult.compliance_notes)}</CardContent>
                  </Card>
                )}
                {copilotResult.estimated_resolution_time && (
                  <div className="flex items-center gap-2 text-sm glass-light rounded-xl p-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Est. Resolution: {copilotResult.estimated_resolution_time}</span>
                  </div>
                )}
                {copilotResult.precedent_cases && Array.isArray(copilotResult.precedent_cases) && copilotResult.precedent_cases.length > 0 && (
                  <Card className="glass-card">
                    <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-serif">Precedent Cases</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-1 space-y-2">
                      {copilotResult.precedent_cases.map((c: any, i: number) => (
                        <div key={i} className="text-sm glass-light rounded-xl p-2">
                          <p className="font-medium text-xs">{c?.case_id}</p>
                          <p className="text-xs text-muted-foreground">{c?.summary}</p>
                          <p className="text-xs mt-1"><span className="font-medium">Outcome:</span> {c?.outcome}</p>
                          <Badge variant="outline" className="text-[9px] mt-1">{c?.relevance}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {copilotResult.follow_up_actions && Array.isArray(copilotResult.follow_up_actions) && (
                  <Card className="glass-card">
                    <CardHeader className="p-3 pb-1"><CardTitle className="text-xs font-serif">Follow-up Actions</CardTitle></CardHeader>
                    <CardContent className="p-3 pt-1">
                      <ul className="space-y-1">
                        {copilotResult.follow_up_actions.map((a: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />{a}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                <Button onClick={handleGetSuggestion} variant="outline" size="sm" className="w-full"><RefreshCw className="w-3 h-3 mr-1" />Refresh Suggestions</Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

// ─── SCREEN: HR Analytics Dashboard ───
function HRAnalyticsDashboardScreen({ sampleMode, activeAgentId, setActiveAgentId }: { sampleMode: boolean; activeAgentId: string | null; setActiveAgentId: (id: string | null) => void }) {
  const [rootCauseResult, setRootCauseResult] = useState<any>(null)
  const [rootCauseLoading, setRootCauseLoading] = useState(false)
  const [rootCauseError, setRootCauseError] = useState('')
  const [slaResult, setSlaResult] = useState<any>(null)
  const [slaLoading, setSlaLoading] = useState(false)
  const [slaError, setSlaError] = useState('')
  const [dateRange, setDateRange] = useState('30d')

  const tickets = sampleMode ? MOCK_TICKETS : []
  const openAndActiveTickets = tickets.filter(t => t.status !== 'resolved')
  const breachedTickets = tickets.filter(t => t.slaHours >= t.slaDeadline && t.status !== 'resolved')
  const escalatedTickets = tickets.filter(t => t.status === 'escalated')
  const atRiskTickets = tickets.filter(t => t.status !== 'resolved' && (t.slaHours / t.slaDeadline) >= 0.7)
  const slaComplianceRate = tickets.length > 0 ? Math.round((tickets.filter(t => t.slaHours < t.slaDeadline || t.status === 'resolved').length / tickets.length) * 100 * 10) / 10 : 0

  // Build detailed ticket data for AI agents
  const buildTicketDataForAgent = () => {
    return openAndActiveTickets.map(t => {
      const breached = t.slaHours >= t.slaDeadline
      const pctUsed = Math.round((t.slaHours / t.slaDeadline) * 100)
      return `- ${t.id}: "${t.subject}" | Category: ${t.category} | Priority: ${t.priority} | Status: ${t.status} | SLA: ${t.slaHours}h elapsed of ${t.slaDeadline}h deadline (${pctUsed}% used)${breached ? ' [SLA BREACHED]' : pctUsed >= 70 ? ' [AT RISK]' : ''} | Dept: ${t.department} | Assignee: ${t.assignee}`
    }).join('\n')
  }

  const metrics = [
    { label: 'Total Tickets', value: tickets.length > 0 ? tickets.length.toString() : '1,247', icon: Ticket, change: '+12%', changeUp: true },
    { label: 'Resolved Today', value: '23', icon: CheckCircle2, change: '+5', changeUp: true },
    { label: 'SLA Compliance', value: tickets.length > 0 ? `${slaComplianceRate}%` : '94.2%', icon: Clock, change: '+1.8%', changeUp: true },
    { label: 'Automation Rate', value: '67%', icon: Zap, change: '+4%', changeUp: true },
  ]

  const categoryData = [
    { label: 'Leave', value: 28, color: 'bg-blue-500', dotColor: 'bg-blue-500' },
    { label: 'Payroll', value: 24, color: 'bg-green-500', dotColor: 'bg-green-500' },
    { label: 'Benefits', value: 18, color: 'bg-purple-500', dotColor: 'bg-purple-500' },
    { label: 'IT Access', value: 15, color: 'bg-orange-500', dotColor: 'bg-orange-500' },
    { label: 'Compliance', value: 10, color: 'bg-red-500', dotColor: 'bg-red-500' },
    { label: 'Onboarding', value: 5, color: 'bg-teal-500', dotColor: 'bg-teal-500' },
  ]

  // Ticket volume trend -- area/line style data over 30 days
  const trendData = [
    { label: 'Week 1', values: [18, 22, 30, 25, 20, 8, 5] },
    { label: 'Week 2', values: [20, 28, 35, 30, 24, 10, 6] },
    { label: 'Week 3', values: [25, 32, 40, 38, 28, 12, 7] },
    { label: 'Week 4', values: [22, 26, 55, 47, 33, 12, 8] },
  ]
  const allValues = trendData.flatMap(w => w.values)
  const trendMax = Math.max(...allValues, 1)
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const handleAnalyzePatterns = async () => {
    setRootCauseLoading(true)
    setRootCauseError('')
    setRootCauseResult(null)
    setActiveAgentId(AGENT_IDS.rootCause)
    try {
      const ticketData = buildTicketDataForAgent()
      const msg = `Analyze recurring patterns and root causes across these HR tickets. Identify automation opportunities.\n\nCurrent Ticket Data (${openAndActiveTickets.length} active tickets, ${breachedTickets.length} SLA breached, ${escalatedTickets.length} escalated):\n${ticketData}\n\nCategories breakdown: ${['Leave', 'Payroll', 'Benefits', 'IT Access', 'Compliance', 'Onboarding'].map(c => `${c}: ${tickets.filter(t => t.category === c).length}`).join(', ')}`
      const result = await callAIAgent(msg, AGENT_IDS.rootCause)
      const data = parseAgentResponse(result)
      setRootCauseResult(data)
    } catch {
      setRootCauseError('Failed to analyze patterns. Please try again.')
    }
    setRootCauseLoading(false)
    setActiveAgentId(null)
  }

  const handlePredictBreaches = async () => {
    setSlaLoading(true)
    setSlaError('')
    setSlaResult(null)
    setActiveAgentId(AGENT_IDS.slaPrediction)
    try {
      const ticketData = buildTicketDataForAgent()
      const msg = `Predict SLA breaches for all currently open and active tickets. Focus especially on tickets that have ALREADY BREACHED their SLA or are close to breaching.\n\nCurrent Ticket Data (${openAndActiveTickets.length} active, ${breachedTickets.length} already breached SLA, ${atRiskTickets.length} at risk of breach):\n${ticketData}\n\nIMPORTANT: The following tickets have ALREADY exceeded their SLA deadline and MUST be flagged as high breach probability:\n${breachedTickets.map(t => `- ${t.id}: "${t.subject}" - ${t.slaHours}h elapsed vs ${t.slaDeadline}h deadline (${Math.round((t.slaHours / t.slaDeadline) * 100)}% over) - Status: ${t.status}`).join('\n')}\n\nAlso flag these at-risk tickets (70%+ SLA consumed):\n${atRiskTickets.filter(t => !breachedTickets.includes(t)).map(t => `- ${t.id}: "${t.subject}" - ${t.slaHours}h elapsed vs ${t.slaDeadline}h deadline (${Math.round((t.slaHours / t.slaDeadline) * 100)}% used)`).join('\n') || 'None'}\n\nProvide specific recommendations for each at-risk and breached ticket.`
      const result = await callAIAgent(msg, AGENT_IDS.slaPrediction)
      const data = parseAgentResponse(result)
      setSlaResult(data)
    } catch {
      setSlaError('Failed to predict breaches. Please try again.')
    }
    setSlaLoading(false)
    setActiveAgentId(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/30">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Analytics Dashboard</h2>
            <p className="text-sm text-muted-foreground">Insights and AI-powered analysis of HR operations</p>
          </div>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Metric Cards */}
          {sampleMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map(m => (
                <Card key={m.label} className="glass-metric shimmer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <m.icon className="w-5 h-5 text-primary" />
                      <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" />{m.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold font-serif">{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Charts Row -- Improved area chart + pie-like distribution */}
          {sampleMode && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 glass-card">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-serif">Ticket Volume Trend (4 Weeks)</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2">
                  {/* Y-axis labels + chart area */}
                  <div className="flex gap-2">
                    {/* Y-axis */}
                    <div className="flex flex-col justify-between h-[180px] py-1">
                      {[trendMax, Math.round(trendMax * 0.75), Math.round(trendMax * 0.5), Math.round(trendMax * 0.25), 0].map(v => (
                        <span key={v} className="text-[9px] text-muted-foreground w-6 text-right">{v}</span>
                      ))}
                    </div>
                    {/* Chart grid */}
                    <div className="flex-1 relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {[0, 1, 2, 3, 4].map(i => (
                          <div key={i} className="w-full border-t border-primary/5" />
                        ))}
                      </div>
                      {/* Bars grouped by day across weeks */}
                      <div className="relative flex items-end gap-1 h-[180px]">
                        {dayLabels.map((day, di) => (
                          <div key={day} className="flex-1 flex items-end gap-[1px] h-full">
                            {trendData.map((week, wi) => {
                              const v = week.values[di]
                              const barH = Math.max((v / trendMax) * 172, 3)
                              const isHighest = v === Math.max(...week.values)
                              const colorClass = isHighest ? 'bg-[hsl(43,75%,38%)]' : wi === trendData.length - 1 ? 'bg-[hsl(27,61%,26%)]' : 'bg-[hsl(27,61%,26%)]/40'
                              return (
                                <div key={wi} className="flex-1 flex flex-col justify-end h-full group relative">
                                  <div
                                    className={`w-full rounded-t-sm ${colorClass} transition-all hover:opacity-80`}
                                    style={{ height: `${barH}px` }}
                                  />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {week.label}: {v}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* X-axis labels */}
                  <div className="flex gap-2 mt-1">
                    <div className="w-6 flex-shrink-0" />
                    <div className="flex-1 flex gap-1">
                      {dayLabels.map(d => <span key={d} className="flex-1 text-center text-[10px] text-muted-foreground font-medium">{d}</span>)}
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-5 mt-3 pt-2 border-t border-white/30">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-2.5 rounded-sm bg-[hsl(27,61%,26%)]/40" /><span className="text-[10px] text-muted-foreground">Weeks 1-3</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-2.5 rounded-sm bg-[hsl(27,61%,26%)]" /><span className="text-[10px] text-muted-foreground">Current Week</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-2.5 rounded-sm bg-[hsl(43,75%,38%)]" /><span className="text-[10px] text-muted-foreground">Peak Day</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-serif">Category Distribution</CardTitle></CardHeader>
                <CardContent className="p-4 pt-2">
                  {/* Donut-style ring */}
                  <div className="flex justify-center mb-3">
                    <div className="relative w-28 h-28">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {(() => {
                          const total = categoryData.reduce((s, c) => s + c.value, 0)
                          let offset = 0
                          const colors = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#14b8a6']
                          return categoryData.map((c, i) => {
                            const pct = (c.value / total) * 100
                            const dashArray = `${pct * 2.51327} ${251.327 - pct * 2.51327}`
                            const dashOffset = -offset * 2.51327
                            offset += pct
                            return <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={colors[i]} strokeWidth="12" strokeDasharray={dashArray} strokeDashoffset={dashOffset} className="transition-all" />
                          })
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-lg font-bold font-serif">100%</p>
                          <p className="text-[9px] text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {categoryData.map(c => (
                      <div key={c.label} className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${c.dotColor} flex-shrink-0`} />
                        <span className="text-xs text-muted-foreground flex-1">{c.label}</span>
                        <span className="text-xs font-semibold">{c.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Root Cause Analysis -- Full-width, all data visible, no click-to-expand */}
          <Card className="glass-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-serif flex items-center gap-2"><Activity className="w-4 h-4 text-accent" />Root Cause Analysis</CardTitle>
                <Button onClick={handleAnalyzePatterns} disabled={rootCauseLoading} size="sm" className="bg-primary text-primary-foreground">
                  {rootCauseLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}{rootCauseResult ? 'Re-analyze' : 'Analyze Patterns'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {!rootCauseResult && !rootCauseLoading && !rootCauseError && (
                <p className="text-sm text-muted-foreground text-center py-4">Click "Analyze Patterns" to discover recurring issues and automation opportunities</p>
              )}
              {rootCauseLoading && (
                <div className="text-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Analyzing patterns...</p></div>
              )}
              {rootCauseError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{rootCauseError}<Button onClick={handleAnalyzePatterns} size="sm" variant="outline" className="mt-2 ml-2">Retry</Button></div>}
              {rootCauseResult && (
                <div className="space-y-5">
                  {/* Recurring Issues -- displayed as a table/grid, fully visible */}
                  {rootCauseResult.recurring_issues && Array.isArray(rootCauseResult.recurring_issues) && rootCauseResult.recurring_issues.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-orange-500" />Recurring Issues ({rootCauseResult.recurring_issues.length})</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {rootCauseResult.recurring_issues.map((issue: any, i: number) => (
                          <div key={i} className="glass-light rounded-xl p-3">
                            <p className="text-sm font-semibold mb-2">{issue?.issue}</p>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Frequency</span>
                                <Badge variant="outline" className="text-[10px]">{issue?.frequency}</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Impact</span>
                                <Badge className={`text-[10px] ${(issue?.impact_score ?? '').toLowerCase().includes('high') ? 'bg-red-100 text-red-700' : (issue?.impact_score ?? '').toLowerCase().includes('medium') ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{issue?.impact_score}</Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Root Cause:</span>
                                <p className="text-foreground mt-0.5">{issue?.root_cause}</p>
                              </div>
                              {Array.isArray(issue?.affected_departments) && issue.affected_departments.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {issue.affected_departments.map((dept: string, di: number) => (
                                    <Badge key={di} variant="outline" className="text-[9px] bg-primary/5">{dept}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Automation Opportunities */}
                  {rootCauseResult.automation_opportunities && Array.isArray(rootCauseResult.automation_opportunities) && rootCauseResult.automation_opportunities.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-accent" />Automation Opportunities ({rootCauseResult.automation_opportunities.length})</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {rootCauseResult.automation_opportunities.map((opp: any, i: number) => (
                          <div key={i} className="glass-light rounded-xl p-3 flex items-start gap-3">
                            <Zap className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{opp?.process}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{opp?.recommendation}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="outline" className="text-[9px]">Vol: {opp?.current_volume}</Badge>
                                <Badge className="text-[9px] bg-accent/20 text-foreground font-medium">{opp?.automation_potential}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Patterns + Priority Actions side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {rootCauseResult.trending_patterns && Array.isArray(rootCauseResult.trending_patterns) && rootCauseResult.trending_patterns.length > 0 && (
                      <div className="glass-light rounded-xl p-3">
                        <h5 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-primary" />Trending Patterns</h5>
                        <ul className="space-y-1.5">{rootCauseResult.trending_patterns.map((p: string, i: number) => (
                          <li key={i} className="text-xs flex items-start gap-2"><span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span><span>{p}</span></li>
                        ))}</ul>
                      </div>
                    )}
                    {rootCauseResult.priority_actions && Array.isArray(rootCauseResult.priority_actions) && rootCauseResult.priority_actions.length > 0 && (
                      <div className="glass-light rounded-xl p-3">
                        <h5 className="text-xs font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-orange-500" />Priority Actions</h5>
                        <ul className="space-y-1.5">{rootCauseResult.priority_actions.map((a: string, i: number) => (
                          <li key={i} className="text-xs flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" /><span>{a}</span></li>
                        ))}</ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SLA Predictions */}
          <Card className="glass-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-serif flex items-center gap-2"><Clock className="w-4 h-4 text-accent" />SLA Predictions</CardTitle>
                <Button onClick={handlePredictBreaches} disabled={slaLoading} size="sm" className="bg-primary text-primary-foreground">
                  {slaLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}Predict Breaches
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {!slaResult && !slaLoading && !slaError && (
                <p className="text-sm text-muted-foreground text-center py-4">Click "Predict Breaches" to identify tickets at risk of SLA violation</p>
              )}
              {slaLoading && (
                <div className="text-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Predicting breaches...</p></div>
              )}
              {slaError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{slaError}<Button onClick={handlePredictBreaches} size="sm" variant="outline" className="mt-2 ml-2">Retry</Button></div>}
              {slaResult && (
                <div className="space-y-4">
                  {slaResult.overall_sla_health && (
                    <div className="flex items-center gap-3 p-3 glass-card rounded-xl">
                      <Activity className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold">Overall SLA Health</p>
                        <p className="text-sm">{slaResult.overall_sla_health}</p>
                      </div>
                      {slaResult.total_at_risk != null && <Badge className="bg-red-100 text-red-700 text-sm px-3">{slaResult.total_at_risk} at risk</Badge>}
                    </div>
                  )}
                  {slaResult.at_risk_tickets && Array.isArray(slaResult.at_risk_tickets) && slaResult.at_risk_tickets.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold mb-2">At-Risk Tickets</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {slaResult.at_risk_tickets.map((t: any, i: number) => (
                          <div key={i} className="glass-light rounded-xl p-3 border border-red-200/30">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-sm font-medium">{t?.ticket_id}</span>
                              <Badge className={`text-[10px] ${(t?.breach_probability ?? '').toLowerCase().includes('high') ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>{t?.breach_probability}</Badge>
                            </div>
                            <p className="text-sm mb-2">{t?.subject}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground mb-1.5">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t?.current_age_hours}h age</span>
                              <span>Deadline: {t?.sla_deadline_hours}h</span>
                              <span>Complexity: {t?.complexity}</span>
                            </div>
                            {t?.recommended_action && <p className="text-xs text-primary font-medium bg-primary/5 rounded px-2 py-1">{t.recommended_action}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {slaResult.recommendations && Array.isArray(slaResult.recommendations) && slaResult.recommendations.length > 0 && (
                    <div className="glass-light rounded-xl p-3">
                      <h5 className="text-xs font-semibold mb-2">Recommendations</h5>
                      <ul className="space-y-1.5">{slaResult.recommendations.map((r: string, i: number) => <li key={i} className="text-xs flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />{r}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── SCREEN: HR Compliance ───
function HRComplianceScreen({ sampleMode, activeAgentId, setActiveAgentId }: { sampleMode: boolean; activeAgentId: string | null; setActiveAgentId: (id: string | null) => void }) {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScanRisks = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    setActiveAgentId(AGENT_IDS.complianceRisk)
    try {
      const res = await callAIAgent('Scan for compliance risks across all open tickets, pending actions, and recent policy changes. Identify legal exposure areas.', AGENT_IDS.complianceRisk)
      const data = parseAgentResponse(res)
      setResult(data)
    } catch {
      setError('Failed to scan risks. Please try again.')
    }
    setLoading(false)
    setActiveAgentId(null)
  }

  const getSeverityColor = (severity: string) => {
    const s = (severity ?? '').toLowerCase()
    if (s.includes('critical')) return 'bg-red-500 text-white'
    if (s.includes('high')) return 'bg-orange-500 text-white'
    if (s.includes('medium')) return 'bg-yellow-500 text-white'
    return 'bg-green-500 text-white'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/30 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Compliance & Risk</h2>
          <p className="text-sm text-muted-foreground">AI-powered compliance risk scanning and monitoring</p>
        </div>
        <Button onClick={handleScanRisks} disabled={loading} className="bg-primary text-primary-foreground">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}Scan Risks
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {!result && !loading && !error && (
            <div className="text-center py-16">
              <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-serif text-lg font-semibold mb-2">Compliance Risk Scanner</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">Click "Scan Risks" to analyze all open tickets and identify compliance risks, legal exposure areas, and preventive measures.</p>
            </div>
          )}
          {loading && (
            <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" /><p className="text-muted-foreground">Scanning for compliance risks...</p></div>
          )}
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg"><p>{error}</p><Button onClick={handleScanRisks} size="sm" variant="outline" className="mt-2">Retry</Button></div>}
          {result && (
            <>
              {/* Risk Summary & Overall Level */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2 glass-card">
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-serif">Risk Summary</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2">{renderMarkdown(result?.risk_summary ?? 'No summary available')}</CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground mb-2">Overall Risk Level</p>
                    <Badge className={`text-lg px-4 py-1 ${getSeverityColor(result?.overall_risk_level ?? '')}`}>{result?.overall_risk_level ?? 'Unknown'}</Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Flagged Cases */}
              {result.flagged_cases && Array.isArray(result.flagged_cases) && result.flagged_cases.length > 0 && (
                <div>
                  <h3 className="font-serif text-lg font-semibold mb-3">Flagged Cases</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.flagged_cases.map((c: any, i: number) => (
                      <Card key={i} className="glass-metric shimmer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm font-medium">{c?.case_id}</span>
                            <Badge className={getSeverityColor(c?.severity ?? '')}>{c?.severity}</Badge>
                          </div>
                          <Badge variant="outline" className="text-[10px] mb-2">{c?.risk_type}</Badge>
                          <p className="text-sm mb-2">{c?.description}</p>
                          {c?.policy_reference && <p className="text-xs text-muted-foreground">Policy: {c.policy_reference}</p>}
                          {c?.recommended_action && (
                            <div className="mt-2 glass-light rounded-xl p-2"><p className="text-xs font-medium text-primary">{c.recommended_action}</p></div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Legal Exposure & Preventive Measures */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {result.legal_exposure_areas && Array.isArray(result.legal_exposure_areas) && (
                  <Card className="glass-card">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-serif flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" />Legal Exposure Areas</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-2">
                      <ul className="space-y-2">{result.legal_exposure_areas.map((a: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />{a}</li>
                      ))}</ul>
                    </CardContent>
                  </Card>
                )}
                {result.preventive_measures && Array.isArray(result.preventive_measures) && (
                  <Card className="glass-card">
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-serif flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Preventive Measures</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-2">
                      <ul className="space-y-2">{result.preventive_measures.map((m: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />{m}</li>
                      ))}</ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── SCREEN: HR Knowledge Base Management ───
function HRKnowledgeBaseScreen({ sampleMode }: { sampleMode: boolean }) {
  const { documents, loading, error, fetchDocuments, uploadDocument, removeDocuments } = useRAGKnowledgeBase()
  const [uploadStatus, setUploadStatus] = useState('')
  const [deleteStatus, setDeleteStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [initialLoaded, setInitialLoaded] = useState(false)

  useEffect(() => {
    if (!initialLoaded) {
      fetchDocuments(RAG_ID)
      setInitialLoaded(true)
    }
  }, [initialLoaded, fetchDocuments])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadStatus('Uploading...')
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadDocument(RAG_ID, files[i])
      }
      setUploadStatus('Upload successful. Document is being trained.')
      await fetchDocuments(RAG_ID)
    } catch {
      setUploadStatus('Upload failed. Please try again.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (fileName: string) => {
    setDeleteStatus(`Deleting ${fileName}...`)
    try {
      await removeDocuments(RAG_ID, [fileName])
      setDeleteStatus(`${fileName} deleted successfully.`)
    } catch {
      setDeleteStatus('Delete failed. Please try again.')
    }
  }

  const docList = Array.isArray(documents) ? documents : []

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/30">
        <h2 className="font-serif text-2xl font-semibold">Knowledge Base</h2>
        <p className="text-sm text-muted-foreground">Manage HR policy documents for AI-powered retrieval</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Upload Area */}
          <Card className="glass-card border-dashed">
            <CardContent className="p-6 text-center">
              <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium mb-1">Upload Policy Documents</p>
              <p className="text-xs text-muted-foreground mb-3">Supported formats: PDF, DOCX, TXT</p>
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" multiple onChange={handleUpload} className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={loading} size="sm" className="bg-primary text-primary-foreground">
                {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}Select Files
              </Button>
              {uploadStatus && <p className={`text-xs mt-2 ${uploadStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{uploadStatus}</p>}
            </CardContent>
          </Card>

          {/* Document List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg font-semibold">Documents</h3>
              <Button onClick={() => fetchDocuments(RAG_ID)} variant="outline" size="sm" disabled={loading}><RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
            </div>
            {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-3">{error}</div>}
            {deleteStatus && <p className={`text-xs mb-2 ${deleteStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{deleteStatus}</p>}
            {loading && docList.length === 0 && (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
              </div>
            )}
            {!loading && docList.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No documents uploaded yet</p>
              </div>
            )}
            <div className="space-y-2">
              {docList.map((doc, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="p-3 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc?.fileName ?? 'Unknown'}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{doc?.fileType ?? 'unknown'}</Badge>
                        {doc?.status && <Badge className={`text-[10px] ${doc.status === 'active' ? 'bg-green-100 text-green-700' : doc.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{doc.status}</Badge>}
                        {doc?.uploadedAt && <span>{doc.uploadedAt}</span>}
                      </div>
                    </div>
                    <Button onClick={() => handleDelete(doc?.fileName ?? '')} variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" disabled={loading}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── SCREEN: HR Settings ───
function HRSettingsScreen({ sampleMode }: { sampleMode: boolean }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/30">
        <h2 className="font-serif text-2xl font-semibold">Settings & Integrations</h2>
        <p className="text-sm text-muted-foreground">Configure integrations, workflows, permissions, and notifications</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="integrations">
            <TabsList className="mb-4">
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="integrations">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'HRMS System', desc: 'Employee records, org data', status: sampleMode ? 'Connected' : 'Not configured' },
                  { name: 'Payroll System', desc: 'Payslips, tax forms, deductions', status: sampleMode ? 'Connected' : 'Not configured' },
                  { name: 'ITSM Platform', desc: 'IT tickets, access requests', status: sampleMode ? 'Syncing' : 'Not configured' },
                ].map(int => (
                  <Card key={int.name} className="glass-card">
                    <CardContent className="p-4">
                      <h4 className="font-serif text-sm font-semibold mb-1">{int.name}</h4>
                      <p className="text-xs text-muted-foreground mb-3">{int.desc}</p>
                      <div className="flex items-center justify-between">
                        <Badge className={int.status === 'Connected' ? 'bg-green-100 text-green-700' : int.status === 'Syncing' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'} variant="outline">{int.status}</Badge>
                        <Button size="sm" variant="outline">Configure</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="workflows">
              <div className="space-y-4">
                <Card className="glass-card">
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-serif">Escalation Rules</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-2">
                    {sampleMode ? (
                      <>
                        <div className="flex items-center justify-between p-2 glass-light rounded-xl">
                          <div><p className="text-sm font-medium">SLA Breach Auto-Escalation</p><p className="text-xs text-muted-foreground">Escalate to manager when SLA is 80% consumed</p></div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-2 glass-light rounded-xl">
                          <div><p className="text-sm font-medium">Negative Sentiment Escalation</p><p className="text-xs text-muted-foreground">Route to senior HR when sentiment is negative</p></div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-2 glass-light rounded-xl">
                          <div><p className="text-sm font-medium">Compliance Risk Alert</p><p className="text-xs text-muted-foreground">Notify legal team on high-risk compliance flags</p></div>
                          <Switch />
                        </div>
                      </>
                    ) : <p className="text-sm text-muted-foreground">Enable sample data to view workflow rules</p>}
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-serif">Auto-Assignment Rules</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-2 space-y-2">
                    {sampleMode ? (
                      <>
                        <div className="flex items-center justify-between p-2 glass-light rounded-xl">
                          <div><p className="text-sm font-medium">Leave Requests</p><p className="text-xs text-muted-foreground">Auto-assign to Benefits team</p></div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 glass-light rounded-xl">
                          <div><p className="text-sm font-medium">Payroll Issues</p><p className="text-xs text-muted-foreground">Auto-assign to Payroll specialists</p></div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 glass-light rounded-xl">
                          <div><p className="text-sm font-medium">IT Access Requests</p><p className="text-xs text-muted-foreground">Route to IT Helpdesk</p></div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      </>
                    ) : <p className="text-sm text-muted-foreground">Enable sample data to view assignment rules</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="permissions">
              <Card className="glass-card">
                <CardContent className="p-4">
                  {sampleMode ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/30">
                            <th className="text-left p-2 font-serif">Role</th>
                            <th className="text-left p-2">View Tickets</th>
                            <th className="text-left p-2">Manage Tickets</th>
                            <th className="text-left p-2">Analytics</th>
                            <th className="text-left p-2">Compliance</th>
                            <th className="text-left p-2">KB Management</th>
                            <th className="text-left p-2">Settings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { role: 'Employee', perms: [true, false, false, false, false, false] },
                            { role: 'HR Staff', perms: [true, true, true, false, false, false] },
                            { role: 'HR Manager', perms: [true, true, true, true, true, false] },
                            { role: 'HR Admin', perms: [true, true, true, true, true, true] },
                          ].map(r => (
                            <tr key={r.role} className="border-b border-primary/5">
                              <td className="p-2 font-medium">{r.role}</td>
                              {r.perms.map((p, i) => (
                                <td key={i} className="p-2">{p ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-muted-foreground/30" />}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">Enable sample data to view role permissions</p>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="glass-card">
                <CardContent className="p-4 space-y-3">
                  {[
                    { label: 'New ticket assignments', desc: 'Get notified when a ticket is assigned to you' },
                    { label: 'SLA warnings', desc: 'Alert when tickets approach SLA deadlines' },
                    { label: 'Escalation alerts', desc: 'Immediate notification for escalated tickets' },
                    { label: 'Compliance risk alerts', desc: 'Alert when new compliance risks are detected' },
                    { label: 'Weekly digest', desc: 'Summary of ticket volume and key metrics' },
                  ].map((n, i) => (
                    <div key={i} className="flex items-center justify-between p-2 glass-light rounded-xl">
                      <div><p className="text-sm font-medium">{n.label}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
                      <Switch defaultChecked={i < 3} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── MAIN PAGE ───
export default function Page() {
  const [role, setRole] = useState<'employee' | 'hr'>('employee')
  const [activeScreen, setActiveScreen] = useState('concierge')
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showAgentPanel, setShowAgentPanel] = useState(false)

  useEffect(() => {
    if (role === 'employee') {
      if (!['concierge', 'mytickets', 'orgchart'].includes(activeScreen)) setActiveScreen('concierge')
    } else {
      if (!['dashboard', 'tickets', 'analytics', 'compliance', 'kb', 'settings'].includes(activeScreen)) setActiveScreen('dashboard')
    }
  }, [role, activeScreen])

  const employeeNav = [
    { id: 'concierge', label: 'AI Concierge', icon: MessageSquare },
    { id: 'mytickets', label: 'My Tickets', icon: Ticket },
    { id: 'orgchart', label: 'Org Chart', icon: Network },
  ]

  const hrNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const navItems = role === 'employee' ? employeeNav : hrNav

  const renderScreen = () => {
    switch (activeScreen) {
      case 'concierge': return <EmployeeConciergeScreen sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} />
      case 'mytickets': return <EmployeeTicketsScreen sampleMode={sampleMode} />
      case 'orgchart': return <EmployeeOrgChartScreen sampleMode={sampleMode} />
      case 'dashboard': return <HROverviewDashboardScreen sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} onNavigate={setActiveScreen} />
      case 'tickets': return <HRTicketDashboardScreen sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} />
      case 'analytics': return <HRAnalyticsDashboardScreen sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} />
      case 'compliance': return <HRComplianceScreen sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} />
      case 'kb': return <HRKnowledgeBaseScreen sampleMode={sampleMode} />
      case 'settings': return <HRSettingsScreen sampleMode={sampleMode} />
      default: return <EmployeeConciergeScreen sampleMode={sampleMode} activeAgentId={activeAgentId} setActiveAgentId={setActiveAgentId} />
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 glass-sidebar flex flex-col transition-all duration-300`}>
          {/* Logo */}
          <div className="p-4 border-b border-white/30 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-serif text-lg font-bold tracking-tight">Lyzr HR Assistant</span>
              </div>
            )}
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1 rounded-lg hover:bg-white/40 transition-all">
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Role Switch */}
          <div className={`p-3 border-b border-white/30 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${role === 'employee' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>Emp</span>
                  <Switch checked={role === 'hr'} onCheckedChange={(checked) => setRole(checked ? 'hr' : 'employee')} />
                  <span className={`text-xs ${role === 'hr' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>HR</span>
                </div>
              </div>
            ) : (
              <button onClick={() => setRole(role === 'employee' ? 'hr' : 'employee')} className="p-1.5 rounded-xl glass-light hover:bg-white/50 transition-all text-foreground" title={`Switch to ${role === 'employee' ? 'HR' : 'Employee'}`}>
                <User className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveScreen(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium glass-nav-item ${activeScreen === item.id ? 'glass-nav-active text-primary-foreground' : 'text-foreground'}`} title={sidebarCollapsed ? item.label : undefined}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Agent Status */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-white/30">
              <button onClick={() => setShowAgentPanel(!showAgentPanel)} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                <Activity className="w-3 h-3" />
                <span>AI Agents</span>
                {activeAgentId && <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="glass-header flex-shrink-0">
            <div className="h-14 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Badge className={role === 'hr' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}>{role === 'hr' ? 'HR Staff' : 'Employee'}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
                  <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={setSampleMode} />
                </div>
                <button className="relative p-1.5 rounded-lg hover:bg-white/40 transition-all">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {sampleMode && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-card" />}
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
              </div>
            </div>
            <AgentThinkingBar activeAgentId={activeAgentId} />
          </header>

          {/* Screen Content */}
          <main className="flex-1 overflow-hidden">
            {renderScreen()}
          </main>
        </div>

        {/* Agent Info Panel */}
        {showAgentPanel && (
          <div className="w-72 border-l border-white/30 glass-panel flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-white/30 flex items-center justify-between">
              <h3 className="font-serif text-sm font-semibold">AI Agent Status</h3>
              <button onClick={() => setShowAgentPanel(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {Object.entries(AGENTS_INFO).map(([id, agent]) => (
                  <div key={id} className={`p-3 rounded-xl transition-all ${activeAgentId === id ? 'glass-heavy border-accent/30 shadow-md' : 'glass-light'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === id ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                      <span className="text-sm font-medium">{agent.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-4">{agent.purpose}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/50 ml-4 mt-1">{id}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
