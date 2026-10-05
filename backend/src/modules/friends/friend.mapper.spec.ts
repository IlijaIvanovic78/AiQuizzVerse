import { otherUserId, relationTo } from './friend.mapper';

describe('friend relations', () => {
  const me = 'user-me';
  const them = 'user-them';

  it('has no relation without a friendship', () => {
    expect(relationTo(null, me)).toEqual({ relation: 'NONE', friendshipId: null });
  });

  it('sees an accepted friendship as friends from both sides', () => {
    const friendship = { id: 'f1', senderId: them, receiverId: me, status: 'ACCEPTED' as const };

    expect(relationTo(friendship, me)).toEqual({ relation: 'FRIEND', friendshipId: 'f1' });
    expect(relationTo(friendship, them)).toEqual({ relation: 'FRIEND', friendshipId: 'f1' });
  });

  it('tells the sender and the receiver of a pending request apart', () => {
    const request = { id: 'r1', senderId: me, receiverId: them, status: 'PENDING' as const };

    expect(relationTo(request, me)).toEqual({ relation: 'REQUEST_SENT', friendshipId: 'r1' });
    expect(relationTo(request, them)).toEqual({ relation: 'REQUEST_RECEIVED', friendshipId: 'r1' });
  });

  it('finds the other player of a friendship', () => {
    const friendship = { senderId: me, receiverId: them };

    expect(otherUserId(friendship, me)).toBe(them);
    expect(otherUserId(friendship, them)).toBe(me);
  });
});
