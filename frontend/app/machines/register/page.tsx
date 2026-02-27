'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { machineConfigAPI, dashboardAPI } from '@/lib/api/client';
import { useCurrentUser } from '@/lib/auth';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle,
  Cpu, Zap, Flame, Wind, Droplets, Cog, Package, Settings, Layers,
} from 'lucide-react';
import { localAdminSidebar } from '@/lib/sidebarConfig';


interface SensorConfig {
  sensor_type: string;
  unit: string;
  normal_min: number;
  normal_max: number;
  critical_max: number;
}

const ALL_SENSORS: Record<string, SensorConfig> = {
  temperature: { sensor_type: 'temperature', unit: '°C',   normal_min: 20,  normal_max: 75,   critical_max: 90   },
  vibration:   { sensor_type: 'vibration',   unit: 'mm/s', normal_min: 0,   normal_max: 5,    critical_max: 10   },
  rpm:         { sensor_type: 'rpm',         unit: 'RPM',  normal_min: 100, normal_max: 3000, critical_max: 3500 },
  load:        { sensor_type: 'load',        unit: '%',    normal_min: 0,   normal_max: 85,   critical_max: 95   },
  pressure:    { sensor_type: 'pressure',    unit: 'bar',  normal_min: 2,   normal_max: 8,    critical_max: 10   },
  current:     { sensor_type: 'current',     unit: 'A',    normal_min: 0,   normal_max: 50,   critical_max: 65   },
};

interface MachineTemplate {
  label: string;
  type: string;
  department: string;
  icon: typeof Cog;
  iconType: string;
  color: string;
  sensors: string[];
  purchaseCost: string;
  hourlyDowntimeCost: string;
}

// ── Full catalog ─────────────────────────────────────────────────────────────
const ALL_MACHINES: MachineTemplate[] = [
  // Generic / cross-industry
  { label: 'CNC Machine',         type: 'CNC',               department: 'Machining',    icon: Cpu,      iconType: 'cog',     color: 'blue',   sensors: ['temperature','vibration','rpm','load'],     purchaseCost: '1500000', hourlyDowntimeCost: '15000' },
  { label: 'Lathe Machine',       type: 'Lathe',             department: 'Machining',    icon: Settings, iconType: 'cog',     color: 'gray',   sensors: ['temperature','vibration','rpm'],            purchaseCost: '400000',  hourlyDowntimeCost: '8000'  },
  { label: 'Hydraulic Press',     type: 'Hydraulic Press',   department: 'Press Shop',   icon: Zap,      iconType: 'zap',     color: 'orange', sensors: ['pressure','load','temperature'],            purchaseCost: '600000',  hourlyDowntimeCost: '12000' },
  { label: 'Injection Moulding',  type: 'Injection Moulding',department: 'Plastics',     icon: Flame,    iconType: 'zap',     color: 'red',    sensors: ['temperature','pressure','load'],            purchaseCost: '800000',  hourlyDowntimeCost: '10000' },
  { label: 'Air Compressor',      type: 'Air Compressor',    department: 'Utilities',    icon: Wind,     iconType: 'cog',     color: 'cyan',   sensors: ['pressure','temperature','vibration'],       purchaseCost: '250000',  hourlyDowntimeCost: '5000'  },
  { label: 'Conveyor Belt',       type: 'Conveyor',          department: 'Assembly',     icon: Package,  iconType: 'package', color: 'green',  sensors: ['load','vibration','current'],               purchaseCost: '200000',  hourlyDowntimeCost: '6000'  },
  { label: 'Welding Machine',     type: 'Welding',           department: 'Fabrication',  icon: Zap,      iconType: 'zap',     color: 'yellow', sensors: ['current','temperature'],                   purchaseCost: '150000',  hourlyDowntimeCost: '4000'  },
  { label: 'Industrial Pump',     type: 'Pump',              department: 'Utilities',    icon: Droplets, iconType: 'droplet', color: 'blue',   sensors: ['pressure','vibration','temperature'],       purchaseCost: '180000',  hourlyDowntimeCost: '4500'  },
  { label: 'Grinding Machine',    type: 'Grinding',          department: 'Machining',    icon: Cog,      iconType: 'cog',     color: 'purple', sensors: ['temperature','vibration','rpm'],            purchaseCost: '350000',  hourlyDowntimeCost: '7000'  },
  { label: 'Boiler',              type: 'Boiler',            department: 'Utilities',    icon: Flame,    iconType: 'zap',     color: 'red',    sensors: ['temperature','pressure'],                  purchaseCost: '500000',  hourlyDowntimeCost: '9000'  },
  { label: 'DG Set / Generator',  type: 'Generator',         department: 'Electrical',   icon: Zap,      iconType: 'zap',     color: 'amber',  sensors: ['current','temperature','load'],             purchaseCost: '700000',  hourlyDowntimeCost: '20000' },
  { label: 'Packaging Machine',   type: 'Packaging',         department: 'Packaging',    icon: Package,  iconType: 'package', color: 'teal',   sensors: ['load','vibration'],                        purchaseCost: '450000',  hourlyDowntimeCost: '8000'  },

  // Textiles
  { label: 'Loom Machine',        type: 'Loom',              department: 'Weaving',      icon: Layers,   iconType: 'cog',     color: 'purple', sensors: ['vibration','load','rpm'],                  purchaseCost: '600000',  hourlyDowntimeCost: '8000'  },
  { label: 'Ring Frame',          type: 'Ring Frame',        department: 'Spinning',     icon: Cpu,      iconType: 'cog',     color: 'blue',   sensors: ['rpm','vibration','temperature'],            purchaseCost: '800000',  hourlyDowntimeCost: '10000' },
  { label: 'Autoconer',           type: 'Autoconer',         department: 'Winding',      icon: Settings, iconType: 'cog',     color: 'gray',   sensors: ['rpm','vibration'],                         purchaseCost: '500000',  hourlyDowntimeCost: '7000'  },
  { label: 'Warping Machine',     type: 'Warping',           department: 'Weaving Prep', icon: Layers,   iconType: 'cog',     color: 'teal',   sensors: ['rpm','load','vibration'],                  purchaseCost: '350000',  hourlyDowntimeCost: '6000'  },
  { label: 'Sizing Machine',      type: 'Sizing',            department: 'Weaving Prep', icon: Flame,    iconType: 'zap',     color: 'orange', sensors: ['temperature','load','pressure'],            purchaseCost: '700000',  hourlyDowntimeCost: '9000'  },
  { label: 'Dyeing Machine',      type: 'Dyeing',            department: 'Processing',   icon: Droplets, iconType: 'droplet', color: 'cyan',   sensors: ['temperature','pressure','load'],            purchaseCost: '900000',  hourlyDowntimeCost: '12000' },
  { label: 'Stenter Machine',     type: 'Stenter',           department: 'Finishing',    icon: Flame,    iconType: 'zap',     color: 'red',    sensors: ['temperature','load'],                      purchaseCost: '1200000', hourlyDowntimeCost: '14000' },
  { label: 'Knitting Machine',    type: 'Knitting',          department: 'Knitting',     icon: Layers,   iconType: 'cog',     color: 'green',  sensors: ['rpm','vibration'],                         purchaseCost: '400000',  hourlyDowntimeCost: '6000'  },

  // Automotive
  { label: 'Stamping Press',      type: 'Stamping Press',    department: 'Body Shop',    icon: Zap,      iconType: 'zap',     color: 'orange', sensors: ['pressure','load','vibration'],              purchaseCost: '2000000', hourlyDowntimeCost: '25000' },
  { label: 'Robotic Arm',         type: 'Robotic Arm',       department: 'Assembly',     icon: Cpu,      iconType: 'cog',     color: 'blue',   sensors: ['current','vibration','load'],               purchaseCost: '3000000', hourlyDowntimeCost: '30000' },
  { label: 'Paint Booth',         type: 'Paint Booth',       department: 'Paint Shop',   icon: Wind,     iconType: 'cog',     color: 'teal',   sensors: ['temperature','pressure','load'],            purchaseCost: '1500000', hourlyDowntimeCost: '20000' },
  { label: 'CMM Machine',         type: 'CMM',               department: 'Quality',      icon: Settings, iconType: 'cog',     color: 'purple', sensors: ['temperature','vibration'],                 purchaseCost: '2500000', hourlyDowntimeCost: '18000' },

  // Food & Beverage
  { label: 'Mixer / Blender',     type: 'Mixer',             department: 'Processing',   icon: Cog,      iconType: 'cog',     color: 'green',  sensors: ['rpm','load','temperature'],                purchaseCost: '300000',  hourlyDowntimeCost: '6000'  },
  { label: 'Pasteurizer',         type: 'Pasteurizer',       department: 'Processing',   icon: Flame,    iconType: 'zap',     color: 'red',    sensors: ['temperature','pressure','load'],            purchaseCost: '500000',  hourlyDowntimeCost: '8000'  },
  { label: 'Filling Machine',     type: 'Filling',           department: 'Packaging',    icon: Package,  iconType: 'package', color: 'cyan',   sensors: ['load','vibration','pressure'],              purchaseCost: '600000',  hourlyDowntimeCost: '9000'  },
  { label: 'Cold Storage Unit',   type: 'Refrigeration',     department: 'Storage',      icon: Wind,     iconType: 'cog',     color: 'blue',   sensors: ['temperature','current','load'],             purchaseCost: '800000',  hourlyDowntimeCost: '10000' },

  // Pharmaceuticals
  { label: 'Tablet Press',        type: 'Tablet Press',      department: 'Manufacturing',icon: Cpu,      iconType: 'cog',     color: 'blue',   sensors: ['load','vibration','rpm'],                  purchaseCost: '1200000', hourlyDowntimeCost: '15000' },
  { label: 'Capsule Filler',      type: 'Capsule Filler',    department: 'Manufacturing',icon: Package,  iconType: 'package', color: 'green',  sensors: ['vibration','load','rpm'],                  purchaseCost: '1000000', hourlyDowntimeCost: '12000' },
  { label: 'Autoclave',           type: 'Autoclave',         department: 'Sterilisation',icon: Flame,    iconType: 'zap',     color: 'red',    sensors: ['temperature','pressure'],                  purchaseCost: '700000',  hourlyDowntimeCost: '10000' },
  { label: 'Coating Machine',     type: 'Coating',           department: 'Finishing',    icon: Layers,   iconType: 'cog',     color: 'teal',   sensors: ['temperature','load','rpm'],                purchaseCost: '900000',  hourlyDowntimeCost: '11000' },

  // Steel & Metals
  { label: 'Induction Furnace',   type: 'Induction Furnace', department: 'Melting',      icon: Flame,    iconType: 'zap',     color: 'red',    sensors: ['temperature','current','load'],             purchaseCost: '5000000', hourlyDowntimeCost: '50000' },
  { label: 'Rolling Mill',        type: 'Rolling Mill',      department: 'Rolling',      icon: Cog,      iconType: 'cog',     color: 'gray',   sensors: ['temperature','vibration','load','rpm'],     purchaseCost: '3000000', hourlyDowntimeCost: '40000' },
  { label: 'Arc Furnace',         type: 'Arc Furnace',       department: 'Melting',      icon: Zap,      iconType: 'zap',     color: 'amber',  sensors: ['current','temperature','load'],             purchaseCost: '8000000', hourlyDowntimeCost: '80000' },

  // Chemicals
  { label: 'Reactor Vessel',      type: 'Reactor',           department: 'Reaction',     icon: Flame,    iconType: 'zap',     color: 'orange', sensors: ['temperature','pressure','load'],            purchaseCost: '2000000', hourlyDowntimeCost: '20000' },
  { label: 'Centrifuge',          type: 'Centrifuge',        department: 'Separation',   icon: Cog,      iconType: 'cog',     color: 'blue',   sensors: ['rpm','vibration','load'],                  purchaseCost: '1500000', hourlyDowntimeCost: '15000' },
  { label: 'Agitator',            type: 'Agitator',          department: 'Mixing',       icon: Settings, iconType: 'cog',     color: 'purple', sensors: ['rpm','load','vibration'],                  purchaseCost: '600000',  hourlyDowntimeCost: '8000'  },
];

// ── Industry → machine labels ─────────────────────────────────────────────────
const INDUSTRY_MACHINES: Record<string, string[]> = {
  'Textiles':          ['Loom Machine','Ring Frame','Autoconer','Warping Machine','Sizing Machine','Dyeing Machine','Stenter Machine','Knitting Machine','Air Compressor','Boiler','Industrial Pump'],
  'Automotive':        ['CNC Machine','Hydraulic Press','Stamping Press','Robotic Arm','Welding Machine','Conveyor Belt','Paint Booth','CMM Machine','Lathe Machine','Air Compressor'],
  'Food & Beverage':   ['Mixer / Blender','Pasteurizer','Filling Machine','Cold Storage Unit','Conveyor Belt','Packaging Machine','Boiler','Air Compressor','Industrial Pump'],
  'Pharmaceuticals':   ['Tablet Press','Capsule Filler','Autoclave','Coating Machine','Mixer / Blender','Air Compressor','Boiler','Industrial Pump'],
  'Steel & Metals':    ['Induction Furnace','Arc Furnace','Rolling Mill','Lathe Machine','Grinding Machine','CNC Machine','Hydraulic Press','Air Compressor','Industrial Pump'],
  'Plastics':          ['Injection Moulding','Conveyor Belt','Air Compressor','Hydraulic Press','Packaging Machine','Industrial Pump'],
  'Chemicals':         ['Reactor Vessel','Centrifuge','Agitator','Boiler','Industrial Pump','Air Compressor','Conveyor Belt'],
  'Paper & Packaging': ['Conveyor Belt','Packaging Machine','Boiler','Air Compressor','Industrial Pump','Hydraulic Press'],
  'Electronics':       ['Conveyor Belt','Air Compressor','Packaging Machine','CNC Machine'],
  'Cement':            ['Air Compressor','Conveyor Belt','Boiler','Industrial Pump','Hydraulic Press','Grinding Machine'],
  'Heavy Machinery':   ['CNC Machine','Lathe Machine','Hydraulic Press','Welding Machine','Grinding Machine','Boiler','Air Compressor'],
  'Agriculture':       ['Conveyor Belt','Packaging Machine','Air Compressor','Industrial Pump','Boiler'],
  'Defense':           ['CNC Machine','Lathe Machine','Hydraulic Press','Welding Machine','Grinding Machine','CMM Machine'],
};

function getCatalog(industry: string | null): { suggested: MachineTemplate[]; others: MachineTemplate[] } {
  const machineMap = new Map(ALL_MACHINES.map(m => [m.label, m]));
  const suggestedLabels = industry ? (INDUSTRY_MACHINES[industry] ?? []) : [];
  const suggested = suggestedLabels.map(l => machineMap.get(l)).filter(Boolean) as MachineTemplate[];
  const suggestedSet = new Set(suggestedLabels);
  const others = ALL_MACHINES.filter(m => !suggestedSet.has(m.label));
  return { suggested, others };
}

const CHIP_COLOR: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700', gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-700', red: 'bg-red-100 text-red-700',
  cyan: 'bg-cyan-100 text-cyan-700', green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700', purple: 'bg-purple-100 text-purple-700',
  amber: 'bg-amber-100 text-amber-700', teal: 'bg-teal-100 text-teal-700',
};

const ic = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function RegisterMachinePage() {
  const router = useRouter();
  const { user, isSuperAdmin, ready } = useCurrentUser();
  const { addToast } = useToast();

  const [industry, setIndustry] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace('/login'); return; }
    if (isSuperAdmin) { router.replace('/admin'); return; }
    dashboardAPI.getOverview()
      .then(d => setIndustry((d.plant as any)?.industry ?? null))
      .catch(() => {});
  }, [ready, user, isSuperAdmin]);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const [name, setName]             = useState('');
  const [type, setType]             = useState('');
  const [department, setDepartment] = useState('');
  const [notes, setNotes]           = useState('');
  const [iconType, setIconType]     = useState('cog');
  const [sensors, setSensors]       = useState<SensorConfig[]>([]);
  const [purchaseCost, setPurchaseCost]             = useState('');
  const [hourlyDowntimeCost, setHourlyDowntimeCost] = useState('');
  const [plannedHours, setPlannedHours]             = useState('8');

  const applyTemplate = (tpl: MachineTemplate) => {
    setSelectedTemplate(tpl.label);
    setType(tpl.type);
    setDepartment(tpl.department);
    setIconType(tpl.iconType);
    setSensors(tpl.sensors.map(k => ({ ...ALL_SENSORS[k] })));
    setPurchaseCost(tpl.purchaseCost);
    setHourlyDowntimeCost(tpl.hourlyDowntimeCost);
  };

  const addSensorPreset = (key: string) => {
    if (sensors.find(s => s.sensor_type === key)) return;
    setSensors(prev => [...prev, { ...ALL_SENSORS[key] }]);
  };
  const removeSensor = (idx: number) => setSensors(prev => prev.filter((_, i) => i !== idx));
  const updateSensor = (idx: number, field: keyof SensorConfig, value: string | number) =>
    setSensors(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const machine = await machineConfigAPI.register({
        name, type, department, icon_type: iconType, notes,
        purchase_cost:         purchaseCost        ? parseInt(purchaseCost)       : undefined,
        hourly_downtime_cost:  hourlyDowntimeCost  ? parseInt(hourlyDowntimeCost) : undefined,
        planned_hours_per_day: plannedHours        ? parseInt(plannedHours)       : undefined,
        sensor_configs: sensors,
      });
      addToast({ type: 'success', title: 'Machine Registered', message: `${name} is now active and ready to receive telemetry.` });
      router.push(`/machines/${machine.id}/config`);
    } catch {
      addToast({ type: 'error', title: 'Registration Failed', message: 'Please check your inputs and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ready || !user || isSuperAdmin) return null;

  const { suggested, others } = getCatalog(industry);

  const CatalogItem = ({ tpl }: { tpl: MachineTemplate }) => {
    const Icon = tpl.icon;
    const isSelected = selectedTemplate === tpl.label;
    return (
      <button
        onClick={() => applyTemplate(tpl)}
        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors
          ${isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : 'hover:bg-gray-50'}`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${CHIP_COLOR[tpl.color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium leading-tight ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>{tpl.label}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {tpl.sensors.map(s => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">{s}</span>
            ))}
          </div>
        </div>
        {isSelected && <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar sections={localAdminSidebar} currentPath="/machines/register" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header appName="PulseAI" appSubtitle="Register Machine" showSearch={false} userName={user.name} userRole="Local Admin" />

        {/* Step indicator strip */}
        <div className="flex items-center gap-4 px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          {[{ n: 1, label: 'Basic Info' }, { n: 2, label: 'Sensors' }, { n: 3, label: 'Economics' }].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                ${step > n ? 'bg-green-500 text-white' : step === n ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > n ? <CheckCircle className="w-3.5 h-3.5" /> : n}
              </div>
              <span className={`text-sm font-medium ${step === n ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
              {n < 3 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: two-panel split ── */}
        {step === 1 && (
          <div className="flex-1 flex overflow-hidden">

            {/* Left: catalog */}
            <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Machine Templates</p>
                {industry
                  ? <p className="text-xs text-blue-600 mt-0.5 font-medium">Showing suggestions for {industry}</p>
                  : <p className="text-xs text-gray-400 mt-0.5">Click to pre-fill details &amp; sensors</p>
                }
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Industry-specific suggestions */}
                {suggested.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                        Suggested for {industry}
                      </span>
                    </div>
                    {suggested.map(tpl => <CatalogItem key={tpl.label} tpl={tpl} />)}
                  </>
                )}

                {/* Other machines */}
                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {suggested.length > 0 ? 'Other Machines' : 'All Machines'}
                  </span>
                  {suggested.length > 0 && (
                    <button
                      onClick={() => setShowOthers(v => !v)}
                      className="text-[10px] text-blue-500 hover:text-blue-700"
                    >
                      {showOthers ? 'Hide' : 'Show all'}
                    </button>
                  )}
                </div>
                {(suggested.length === 0 || showOthers) &&
                  others.map(tpl => <CatalogItem key={tpl.label} tpl={tpl} />)
                }
              </div>
            </div>

            {/* Right: form */}
            <div className="flex-1 p-6 flex flex-col overflow-hidden">
              {selectedTemplate && (
                <div className="flex-shrink-0 mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span><strong>{selectedTemplate}</strong> applied — type, department, sensors &amp; costs pre-filled. Edit below as needed.</span>
                </div>
              )}

              <Card className="flex-1 p-5 flex flex-col overflow-hidden">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex-shrink-0">Machine Details</h2>
                <div className="flex-1 grid grid-cols-2 gap-4 content-start">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Machine Name <span className="text-red-500">*</span></label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="e.g. Loom 04 — Shed B" className={ic} />
                    <p className="text-xs text-gray-400 mt-1">Give it a specific name identifiable on the shop floor</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Machine Type <span className="text-red-500">*</span></label>
                    <input type="text" value={type} onChange={e => setType(e.target.value)}
                      placeholder="e.g. Loom, Ring Frame, CNC" className={ic} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input type="text" value={department} onChange={e => setDepartment(e.target.value)}
                      placeholder="e.g. Weaving, Spinning" className={ic} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      placeholder="Make, model, serial number, or any additional context" className={ic} />
                  </div>
                </div>
                <div className="flex-shrink-0 mt-4 flex justify-end border-t border-gray-100 pt-4">
                  <Button onClick={() => setStep(2)} disabled={!name || !type} variant="primary">
                    Next: Sensors <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── STEP 2: Sensor Config ── */}
        {step === 2 && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              <Card className="p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-0.5">Sensor Configuration</h2>
                <p className="text-xs text-gray-500 mb-4">Define safe operating ranges. Alerts fire automatically when readings exceed these thresholds.</p>

                {selectedTemplate && sensors.length > 0 && (
                  <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                    Pre-filled from <strong>{selectedTemplate}</strong> — adjust thresholds to your machine's actual specs.
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-600 mb-2">Add sensor:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(ALL_SENSORS).map(key => (
                      <button key={key} onClick={() => addSensorPreset(key)}
                        disabled={!!sensors.find(s => s.sensor_type === key)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition
                          ${sensors.find(s => s.sensor_type === key)
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'}`}>
                        <Plus className="w-3 h-3 inline mr-0.5" />{key}
                      </button>
                    ))}
                  </div>
                </div>

                {sensors.length === 0
                  ? <p className="text-xs text-gray-400 italic mb-3">No sensors added — you can skip and configure later.</p>
                  : (
                    <div className="space-y-2 mb-2">
                      {sensors.map((sensor, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-700 capitalize">{sensor.sensor_type} <span className="text-gray-400 font-normal">({sensor.unit})</span></span>
                            <button onClick={() => removeSensor(idx)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(['normal_min', 'normal_max', 'critical_max'] as const).map(field => (
                              <div key={field}>
                                <label className="block text-[10px] text-gray-500 mb-1">
                                  {field === 'normal_min' ? 'Normal min' : field === 'normal_max' ? 'Normal max' : 'Critical max'}
                                </label>
                                <input type="number" value={sensor[field]}
                                  onChange={e => updateSensor(idx, field, parseFloat(e.target.value))}
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }

                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <Button onClick={() => setStep(1)} variant="secondary" size="sm"><ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
                  <Button onClick={() => setStep(3)} variant="primary" size="sm">Next: Economics <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── STEP 3: Economics ── */}
        {step === 3 && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              <Card className="p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-0.5">Machine Economics</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Powers the cost engine that triggers government scheme suggestions.
                  {selectedTemplate && <span className="text-blue-600"> Pre-filled from {selectedTemplate} — adjust to your actual costs.</span>}
                </p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost (₹)</label>
                    <input type="number" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)}
                      placeholder="e.g. 850000" className={ic} />
                    <p className="text-xs text-gray-400 mt-1">For scheme eligibility</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Downtime Cost / hr (₹)</label>
                    <input type="number" value={hourlyDowntimeCost} onChange={e => setHourlyDowntimeCost(e.target.value)}
                      placeholder="e.g. 12000" className={ic} />
                    <p className="text-xs text-gray-400 mt-1">Production loss per hour down</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Planned Hours / Day</label>
                    <input type="number" value={plannedHours} onChange={e => setPlannedHours(e.target.value)}
                      placeholder="8" min="1" max="24" className={ic} />
                    <p className="text-xs text-gray-400 mt-1">Scheduled operating hours</p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 mb-4">
                  <strong>How it works:</strong> When downtime is logged, the system calculates{' '}
                  <code>Total Loss = Repair Cost + (Hours × ₹{hourlyDowntimeCost || '?'}/hr)</code>.{' '}
                  If Total Loss &gt; ₹50,000, relevant government schemes are automatically surfaced.
                </div>

                <div className="flex justify-between pt-3 border-t border-gray-100">
                  <Button onClick={() => setStep(2)} variant="secondary" size="sm"><ChevronLeft className="w-3.5 h-3.5 mr-1" /> Back</Button>
                  <Button onClick={handleSubmit} variant="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Registering…' : 'Register Machine'}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
