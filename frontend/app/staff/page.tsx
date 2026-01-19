'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Users, Plus, LinkedinIcon, Mail, Sparkles } from 'lucide-react';
import { teamAPI, TeamMember } from '@/lib/api/client';
import TeamMemberModal from '@/components/staff/TeamMemberModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const sidebarSections = [
  {
    items: [
      { label: 'Overview', href: '/overview', icon: 'dashboard' as const },
      { label: 'Machines', href: '/machines', icon: 'machines' as const },
      { label: 'Simulator', href: '/simulator', icon: 'simulator' as const },
      { label: 'Policy Support', href: '/policy-support', icon: 'policy' as const },
      { label: 'Staff', href: '/staff', icon: 'users' as const },
      { label: 'Analytics', href: '/analytics', icon: 'analytics' as const },
      { label: 'Settings', href: '/settings', icon: 'settings' as const },
    ],
  },
];

export default function StaffPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const loadMembers = async () => {
    try {
      setIsLoading(true);
      const data = await teamAPI.getAll();
      setMembers(data);
    } catch (error) {
      console.error('Error loading team members:', error);
      // Set empty array if API fails
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleAddMember = () => {
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMember(null);
  };

  const handleSave = () => {
    loadMembers();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header
        appName="FactoryHealth AI"
        appSubtitle="Project Team"
        searchPlaceholder="Search team..."
        showSearch={false}
        logo={
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar sections={sidebarSections} currentPath="/staff" />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Project Team</h1>
                <p className="text-gray-600">Meet the team behind FactoryHealth AI</p>
              </div>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={handleAddMember}
              >
                Add Member
              </Button>
            </div>

            {/* Team Stats */}
            <Card className="mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-sm text-gray-500">Team Members</p>
                </div>
              </div>
            </Card>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && members.length === 0 && (
              <Card className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
                <p className="text-gray-500 mb-4">Add your first team member to get started</p>
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleAddMember}
                >
                  Add Team Member
                </Button>
              </Card>
            )}

            {/* Team Grid */}
            {!isLoading && members.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <Card
                    key={member.id}
                    hover
                    className="cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => handleMemberClick(member)}
                  >
                    <div className="text-center">
                      {/* Photo or Initials */}
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        {member.photo_url ? (
                          <img
                            src={`${API_BASE}${member.photo_url}`}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-white">
                            {getInitials(member.name)}
                          </span>
                        )}
                      </div>

                      {/* Name & Role */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                      <p className="text-sm text-blue-600 font-medium mb-3">{member.role}</p>

                      {/* Bio */}
                      {member.bio && (
                        <p className="text-sm text-gray-500 mb-4 line-clamp-3">{member.bio}</p>
                      )}

                      {/* Links */}
                      <div className="flex items-center justify-center gap-3 pt-3 border-t border-gray-100">
                        {member.linkedin_url && (
                          <a
                            href={member.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <LinkedinIcon className="w-5 h-5" />
                          </a>
                        )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Mail className="w-5 h-5" />
                          </a>
                        )}
                        {!member.linkedin_url && !member.email && (
                          <span className="text-sm text-gray-400">Click to add details</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Team Member Modal */}
      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        member={selectedMember}
        onSave={handleSave}
      />
    </div>
  );
}
