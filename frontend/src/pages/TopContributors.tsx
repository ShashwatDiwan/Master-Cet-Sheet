import { useState } from 'react';
import logo from '@/assets/Logo.png';
import { 
  Trophy, 
  Star, 
  Award, 
  Users, 
  BookOpen, 
  FileText, 
  Video, 
  Download,
  Heart,
  Share2,
  TrendingUp,
  Github,
  Linkedin
} from 'lucide-react';

interface Contributor {
  id: string;
  name: string;
  avatar: string;
  rank: number;
  totalContributions: number;
  subjects: string[];
  pdfsContributed: number;
  videosContributed: number;
  notesContributed: number;
  shortNotesContributed: number;
  joinDate: string;
  description: string;
  achievements: string[];
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
}

const mockContributors: Contributor[] = [
  {
    id: '1',
    name: 'Shashwat Diwan',
    avatar: '👦',
    rank: 1,
    totalContributions: 120,
    subjects: ['MHTCET'],
    pdfsContributed: 9,
    videosContributed: 0,
    notesContributed: 65,
    shortNotesContributed: 55,
    joinDate: 'March 2024',
    description: 'MHTCET Percentile: 98.9',
    achievements: ['🏆 Top Contributor'],
    socialLinks: { github: '#', linkedin: '#' }
  },
  {
    id: '2',
    name: 'Jinendra Dhondge',
    avatar: '😎',
    rank: 2,
    totalContributions: 85,
    subjects: ['MHTCET'],
    pdfsContributed: 3,
    videosContributed: 0,
    notesContributed: 63,
    shortNotesContributed:22,
    joinDate: 'February 2024',
    description: 'MHTCET Percentile: 98.6',
    achievements: ['🥈 Silver Contributor'],
    socialLinks: { github: '#', linkedin: '#' }
  },
  {
    id: '3',
    name: 'Aryan Dhole',
    avatar: '😍',
    rank: 3,
    totalContributions: 10,
    subjects: ['MHTCET'],
    pdfsContributed: 2,
    videosContributed: 0,
    notesContributed: 6,
    shortNotesContributed:4,
    joinDate: 'January 2024',
    description: 'MHTCET Percentile: 99.1',
    achievements: ['🥉 Bronze Contributor'],
    socialLinks: { github: '#', linkedin: '#' }
  },
  /*{
    id: '4',
    name: 'Pranjali Diwan',
    avatar: '👩‍🎓',
    rank: 4,
    totalContributions: 55,
    subjects: ['MHTCET'],
    pdfsContributed: 0,
    videosContributed: 0,
    notesContributed: 55,
    joinDate: 'December 2023',
    description: 'MHTCET Percentile: 94+',
    achievements: ['🌟 Rising Star'],
    socialLinks: { github: '#', linkedin: '#' }
  }*/
];

const TopContributors = () => {
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContributor(null);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500 to-orange-500';
    if (rank === 2) return 'from-gray-400 to-gray-600';
    if (rank === 3) return 'from-amber-600 to-orange-700';
    return 'from-zinc-600 to-zinc-800';
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-red-500/3 rounded-full blur-3xl animate-float"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl"><img src={logo} alt="EbookStore logo" className="w-20 h-20 object-contain" /></span>
            </div>
            <h1 className="text-5xl font-bold mb-0">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                EbookStore's
              </span>
              <span className="text-white ml-3">Top Contributors</span>
            </h1>
          </div>
          <p className="text-base text-zinc-300 max-w-xl mx-auto">
            Celebrating the amazing students who share knowledge and help others succeed
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { 
              icon: Users, 
              label: 'Total Contributors', 
              value: mockContributors.length, 
              color: 'blue',
              description: 'Active members'
            },
            { 
              icon: FileText, 
              label: 'Total PDFs', 
              value: mockContributors.reduce((sum, c) => sum + c.pdfsContributed, 0), 
              color: 'green',
              description: 'Study materials'
            },
            { 
              icon: Video, 
              label: 'Total Videos', 
              value: mockContributors.reduce((sum, c) => sum + c.videosContributed, 0), 
              color: 'purple',
              description: 'Video explanations'
            },
            { 
              icon: BookOpen, 
              label: 'Total Notes', 
              value: mockContributors.reduce((sum, c) => sum + c.notesContributed, 0), 
              color: 'orange',
              description: 'Handwritten notes'
            }
          ].map((stat, index) => (
            <div 
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl glass-morphism p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 animate-fade-in-up card-hover"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 border border-${stat.color}-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-zinc-400 text-sm font-medium">{stat.label}</p>
                  <p className="text-zinc-500 text-xs">{stat.description}</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </div>
          ))}
        </div>

        {/* Top Contributors Grid */}
        <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-3xl font-bold text-white">Hall of Fame</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mockContributors.slice(0,3).map((contributor, index) => (
              <div 
                key={contributor.id}
                className="group cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-fade-in-up card-hover"
                style={{ animationDelay: `${500 + index * 100}ms` }}
                onClick={() => handleContributorClick(contributor)}
              >
                <div className={`relative overflow-hidden rounded-xl p-4 hover:bg-white/10 transition-all duration-300 border bg-gradient-to-br ${
                  index === 0
                    ? 'from-amber-500/10 to-amber-600/10 border-amber-500/30'
                    : index === 1
                    ? 'from-emerald-500/10 to-emerald-600/10 border-emerald-500/30'
                    : 'from-purple-500/10 to-purple-600/10 border-purple-500/30'
                }`}>
                  {/* Rank Badge */}
                  <div className={`absolute top-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(contributor.rank)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                    {getRankIcon(contributor.rank)}
                  </div>
                  
                  {/* Avatar and Name */}
                  <div className="text-center mb-4">
                    <div className="text-5xl mb-2">{contributor.avatar}</div>
                    <h3 className="text-lg font-semibold text-white mb-1">{contributor.name}</h3>
                    <p className="text-zinc-400 text-xs">{contributor.joinDate}</p>
                  </div>
                  
                  {/* Stats - only three fields */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-sm">Total Contributions</span>
                      <span className="text-white font-semibold">{contributor.totalContributions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-sm">Notes</span>
                      <span className="text-green-400 font-semibold">{contributor.notesContributed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400 text-sm">Short Notes</span>
                      <span className="text-purple-400 font-semibold">{Math.floor(contributor.shortNotesContributed)}</span>
                    </div>
                  </div>
                  
                  {/* MHTCET Percentile */}
                  <div className="mb-2">
                    <p className="text-zinc-400 text-sm mb-1">MHTCET Percentile</p>
                    <div className={`px-2 py-1 text-xs rounded-full inline-block border ${
                      index === 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : index === 1
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    }`}>
                      {contributor.description.replace('MHTCET Percentile: ', '')}
                    </div>
                  </div>

                  {/* Social small icons */}
                  <div className="mt-2 flex justify-center gap-3 opacity-80 text-xs">
                    <Linkedin className="w-4 h-4 text-blue-500" />
                    <Github className="w-4 h-4 text-white" />
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="glass-morphism rounded-3xl p-8 text-center animate-fade-in-up" style={{ animationDelay: '800ms' }}>
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-4">Want to Join the Elite?</h2>
          <p className="text-zinc-300 mb-6 max-w-2xl mx-auto">
            Share your study materials, notes, and resources to help fellow students and earn recognition in our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105">
              Start Contributing
            </button>
            <button className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-all duration-300 hover:scale-105 border border-zinc-700">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Contributor Detail Modal */}
      {showModal && selectedContributor && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-6 border-b border-zinc-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedContributor.avatar}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedContributor.name}</h2>
                    <p className="text-zinc-400">Rank #{selectedContributor.rank} Contributor</p>
                  </div>
                </div>
                <button 
                  onClick={closeModal}
                  className="text-zinc-400 hover:text-white text-2xl p-3 hover:bg-zinc-800 rounded-xl transition-all duration-300 hover:scale-110"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">About</h3>
                  <p className="text-zinc-300 leading-relaxed">{selectedContributor.description}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Contributions:</span>
                      <span className="text-white font-semibold">{selectedContributor.totalContributions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">PDFs:</span>
                      <span className="text-green-400 font-semibold">{selectedContributor.pdfsContributed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Videos:</span>
                      <span className="text-purple-400 font-semibold">{selectedContributor.videosContributed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Notes:</span>
                      <span className="text-orange-400 font-semibold">{selectedContributor.notesContributed}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Achievements</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedContributor.achievements.map((achievement, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-2 bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-500/30 flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      {achievement}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Social Links</h3>
                <div className="flex gap-4">
                  {selectedContributor.socialLinks.github && (
                    <a 
                      href={selectedContributor.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors duration-300 flex items-center gap-2"
                    >
                      <span>GitHub</span>
                    </a>
                  )}
                  {selectedContributor.socialLinks.linkedin && (
                    <a 
                      href={selectedContributor.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2"
                    >
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {selectedContributor.socialLinks.twitter && (
                    <a 
                      href={selectedContributor.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors duration-300 flex items-center gap-2"
                    >
                      <span>Twitter</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopContributors; 