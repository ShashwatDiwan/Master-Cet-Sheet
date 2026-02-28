import { useState } from 'react';
import logo from '@/assets/Logo.png';
import shashImage from '@/assets/shashwat.jpeg';
import jiniImage from '@/assets/Jini.jpg';
import aryanImage from '@/assets/aryan.jpg';
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
  avatarUrl: string;
  rank: number;
  totalContributions: number;
  subjects: string[];
  videosContributed: number;
  notesContributed: number;
  shortNotesContributed: number;
  joinDate: string;
  bio: string;            // short biography to show in modal
  percentile: string;    // MHTCET percentile string shown on card
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
    avatarUrl: shashImage,
    rank: 1,
    totalContributions: 38,
    subjects: ['MHTCET'],
    videosContributed: 0,
    notesContributed: 22,
    shortNotesContributed: 16,
    joinDate: 'March 2024',
    bio: 'Motivated Java Developer skilled in building scalable backend-focused applications using Spring Boot, Hibernate, Spring Security, and REST APIs, with exposure to microservices architecture, DevOps practices (CI/CD, Docker), and AI integration using Spring AI. Solved 190+ DSA problems on LeetCode, experienced with MySQL/SQL databases, and recognized as an effective team collaborator',
    percentile: '98.9',
    achievements: ['🏆 Top Contributor'],
    socialLinks: { github: 'https://github.com/ShashwatDiwan', linkedin: 'https://www.linkedin.com/in/shashwatdiwan/' }
  },
  {
    id: '2',
    name: 'Jinendra Dhondge',
    avatarUrl: jiniImage,
    rank: 2,
    totalContributions: 20,
    subjects: ['MHTCET'],
    videosContributed: 0,
    notesContributed: 3,
    shortNotesContributed:17,
    joinDate: 'February 2024',
    bio: 'I am a Full Stack Developer with a passion for building scalable, end-to-end web applications that solve real-world problems. With a strong foundation in Data Structures and Algorithms (DSA), I approach every coding challenge with an analytical mindset to ensure optimal performance.',
    percentile: '98.6',
    achievements: ['🥈 Silver Contributor'],
    socialLinks: { linkedin: 'https://www.linkedin.com/in/jinendra-dhongde-b1b4a830b/' }
  },
  {
    id: '3',
    name: 'Aryan Dhole',
    avatarUrl: aryanImage,
    rank: 3,
    totalContributions: 5,
    subjects: ['MHTCET'],
    videosContributed: 0,
    notesContributed: 2,
    shortNotesContributed:3,
    joinDate: 'January 2024',
    bio: 'I am a Machine Learning Engineer with a deep-rooted foundation in computer science core subjects, including OS, DBMS, and OOPS. My technical expertise is backed by rigorous problem-solving, having successfully tackled 300+ challenges in Data Structures and Algorithms (DSA) to ensure every model I build is optimized for performance and scalability.',
    percentile: '99.1',
    achievements: ['🥉 Bronze Contributor'],
    socialLinks: { linkedin: 'https://www.linkedin.com/in/aryan-dhole/' }
  },
];

const TopContributors = () => {
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContributor(null);
  };

  const closeLearnMore = () => {
    setShowLearnMore(false);
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
              label: 'Total Notes', 
              value: mockContributors.reduce((sum, c) => sum + c.notesContributed, 0), 
              color: 'green',
              description: 'Study materials'
            },
            { 
              icon: Video, 
              label: 'Total Videos', 
              value: mockContributors.reduce((sum, c) => sum + c.videosContributed, 0), 
              color: 'purple',
              description: 'Upcoming feature'
            },
            { 
              icon: BookOpen, 
              label: 'Total Short Notes', 
              value: mockContributors.reduce((sum, c) => sum + c.shortNotesContributed, 0), 
              color: 'orange',
              description: 'Handwritten'
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
                    <div className="mx-auto w-24 h-24 rounded-full overflow-hidden mb-2">
                      <img src={contributor.avatarUrl} alt={contributor.name} className="w-full h-full object-cover" />
                    </div>
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
                      {contributor.percentile}%
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
            If you'd like to contribute your notes to the community, simply email them to us and we'll add you to the hall of fame!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=shashh.code@gmail.com&su=Contributing%20Notes&body=Hi%20team,%0A%0AI%27d%20like%20to%20share%20my%20study%20notes%20and%20contribute%20to%20the%20community.%0A%0APlease%20find%20my%20notes%20attached.%0A%0AThanks,%0A[Your%20Name]"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105"
            >
              Mail Us Your Notes
            </a>
            <button 
              onClick={() => setShowLearnMore(true)}
              className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-all duration-300 hover:scale-105 border border-zinc-700"
            >
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
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    <img src={selectedContributor.avatarUrl} alt={selectedContributor.name} className="w-full h-full object-cover" />
                  </div>
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
                  <p className="text-zinc-300 leading-relaxed">{selectedContributor.bio}</p>
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
                      <span className="text-green-400 font-semibold">{selectedContributor.notesContributed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Videos:</span>
                      <span className="text-purple-400 font-semibold">{selectedContributor.videosContributed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Short Notes:</span>
                      <span className="text-orange-400 font-semibold">{selectedContributor.shortNotesContributed}</span>
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

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 p-6 border-b border-zinc-700 sticky top-0">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Share Your Knowledge</h2>
                <button 
                  onClick={closeLearnMore}
                  className="text-zinc-400 hover:text-white text-2xl p-3 hover:bg-zinc-800 rounded-xl transition-all duration-300 hover:scale-110"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Motivation Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  Why Share Your Notes?
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  Contributing your study materials is one of the most meaningful ways to help your peers succeed. When you share your notes, you're not just providing documents—you're sharing your understanding, insights, and hard work.
                </p>
                <div className="space-y-3 mt-4">
                  <div className="flex gap-3">
                    <span className="text-green-400 text-lg">✓</span>
                    <div>
                      <p className="text-white font-semibold">Help Others Succeed</p>
                      <p className="text-zinc-400 text-sm">Your notes can be the key resource that helps someone finally understand a difficult concept.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-green-400 text-lg">✓</span>
                    <div>
                      <p className="text-white font-semibold">Build Your Reputation</p>
                      <p className="text-zinc-400 text-sm">Get recognized in our Hall of Fame and build credibility in the student community.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-green-400 text-lg">✓</span>
                    <div>
                      <p className="text-white font-semibold">Give Back to the Community</p>
                      <p className="text-zinc-400 text-sm">Be part of a mission to make quality study materials accessible to everyone.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  How to Share Your Notes
                </h3>
                <div className="space-y-4">
                  <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                      <div>
                        <p className="text-white font-semibold">Prepare Your Notes</p>
                        <p className="text-zinc-400 text-sm mt-1">Organize your notes by chapter or topic. Make sure they're legible and well-structured. You can use PDF, images, or any clear format.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                      <div>
                        <p className="text-white font-semibold">Click "Mail Us Your Notes"</p>
                        <p className="text-zinc-400 text-sm mt-1">Hit the button below to open a pre-filled email to our contribution team.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                      <div>
                        <p className="text-white font-semibold">Attach Your Files</p>
                        <p className="text-zinc-400 text-sm mt-1">Attach your note files to the email along with your name and the chapters/topics they cover.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                      <div>
                        <p className="text-white font-semibold">Submit & Get Featured</p>
                        <p className="text-zinc-400 text-sm mt-1">Send the email and wait for our team to review. Once approved, you'll be featured in our Hall of Fame!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6 text-center">
                <p className="text-zinc-300 mb-4">Ready to make an impact?</p>
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=contribute@ebooks.com&su=Contributing%20Notes&body=Hi%20team,%0A%0AI%27d%20like%20to%20share%20my%20study%20notes%20and%20contribute%20to%20the%20community.%0A%0APlease%20find%20my%20notes%20attached.%0A%0AThanks,%0A[Your%20Name]"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeLearnMore}
                  className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105"
                >
                  Mail Us Your Notes Now
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopContributors; 