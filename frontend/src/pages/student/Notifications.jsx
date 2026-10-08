/**
 * Notifications — /student/notifications
 * List with unread dots, mark as read, all/unread filter.
 * Shortlist notifications show contact email only after shortlist_locked.
 */
import { useState, useEffect } from 'react';
import { useRound } from '@/context/RoundContext';
import { useToastContext } from '@/components/Toast';
import GlassCard from '@/components/GlassCard';
import Skeleton from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import * as api from '@/data/api';

const PHASE_REVEALS_CONTACT = [
  'shortlist_locked','interviewing','company_ranking','company_locked','matched','revealed'
];

export default function StudentNotifications() {
  const { phase }    = useRound();
  const { toast }    = useToastContext();
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);

  const contactVisible = PHASE_REVEALS_CONTACT.includes(phase);

  useEffect(() => {
    api.getNotifications()
      .then(r => setNotifs(r.notifications))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id) {
    await api.markNotificationRead(id).catch(()=>{});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const unread = notifs.filter(n=>!n.read);
    await Promise.all(unread.map(n => api.markNotificationRead(n.id)));
    setNotifs(prev => prev.map(n=>({...n, read: true})));
  }

  const displayed = filter === 'unread' ? notifs.filter(n=>!n.read) : notifs;
  const unreadCount = notifs.filter(n=>!n.read).length;

  return (
    <div style={{ maxWidth:680,margin:'0 auto',padding:'var(--space-8) var(--space-6)' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'var(--space-4)',marginBottom:'var(--space-6)' }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-heading)',fontSize:'var(--text-3xl)',fontWeight:800,color:'var(--color-ink)',marginBottom:'var(--space-1)' }}>Notifications</h1>
          {unreadCount > 0 && <p style={{ color:'var(--color-ink-2)' }}>{unreadCount} unread</p>}
        </div>
        <div style={{ display:'flex',gap:'var(--space-3)',alignItems:'center' }}>
          <div style={{ display:'flex',background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-full)',padding:3 }}>
            {['all','unread'].map(f=>(
              <button key={f} type="button" onClick={()=>setFilter(f)}
                style={{ padding:'var(--space-1) var(--space-4)',borderRadius:'var(--radius-full)',border:'none',cursor:'pointer',fontSize:'var(--text-sm)',fontWeight:600,background:filter===f?'var(--color-primary)':'transparent',color:filter===f?'white':'var(--color-ink-2)',transition:'all var(--transition-fast)',minHeight:'36px' }}>
                {f === 'all' ? 'All' : 'Unread'}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="btn btn--ghost btn--sm">Mark all read</button>
          )}
        </div>
      </div>

      {loading ? (
        <Skeleton count={4} height="80px" />
      ) : displayed.length === 0 ? (
        <EmptyState title={filter==='unread' ? 'No unread notifications' : 'No notifications yet'}
          message={filter==='unread' ? 'You\'re all caught up.' : 'Shortlist updates and match results will appear here.'} />
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:'var(--space-3)' }}>
          {displayed.map(n => (
            <GlassCard key={n.id} opaque={!n.read} radius="sm" padding="var(--space-5)"
              style={{ borderLeft: n.read ? 'none' : '3px solid var(--color-primary)', opacity: n.read ? 0.8 : 1 }}>
              <div style={{ display:'flex',gap:'var(--space-3)',alignItems:'flex-start' }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:n.read?'transparent':'var(--color-primary)',flexShrink:0,marginTop:6,border:n.read?'1px solid var(--color-border)':'none' }} aria-hidden="true" />
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ fontSize:'var(--text-sm)',color:'var(--color-ink)',lineHeight:'var(--leading-snug)',marginBottom:'var(--space-1)' }}>{n.message}</p>

                  {/* Contact reveal */}
                  {n.meta?.contact_email && contactVisible && (
                    <div style={{ marginTop:'var(--space-2)',padding:'var(--space-2) var(--space-3)',background:'var(--color-accent-light)',border:'1px solid rgba(16,185,129,0.25)',borderRadius:'var(--radius-sm)' }}>
                      <p style={{ fontSize:'var(--text-xs)',color:'var(--color-ink-3)',marginBottom:2 }}>Contact</p>
                      <a href={`mailto:${n.meta.contact_email}`} style={{ fontSize:'var(--text-sm)',color:'var(--color-accent)',fontWeight:600 }}>
                        {n.meta.contact_email}
                      </a>
                    </div>
                  )}
                  {n.meta?.contact_email && !contactVisible && (
                    <p style={{ fontSize:'var(--text-xs)',color:'var(--color-ink-3)',marginTop:'var(--space-1)' }}>
                      Contact email will be revealed after shortlisting is finalised.
                    </p>
                  )}

                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'var(--space-2)' }}>
                    <p style={{ fontSize:'var(--text-xs)',color:'var(--color-ink-3)' }}>
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                    {!n.read && (
                      <button type="button" onClick={()=>markRead(n.id)}
                        style={{ fontSize:'var(--text-xs)',color:'var(--color-primary)',background:'none',border:'none',cursor:'pointer',minHeight:'44px',padding:'var(--space-1) var(--space-2)' }}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
