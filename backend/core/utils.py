from django.db.models import Q
from .models import ClassSchedule, LostFoundItem, Notification

def check_schedule_conflict(day, start, end, room=None, faculty=None, exclude_id=None):
    """
    Checks if a class overlaps with existing schedules.
    Returns (True, message) if conflict exists, (False, "") otherwise.
    """
    # Filter for active schedules on the same day
    base_query = ClassSchedule.objects.filter(day_of_week=day, is_active=True)
    if exclude_id:
        base_query = base_query.exclude(id=exclude_id)

    # Overlap logic: (StartA < EndB) and (EndA > StartB)
    time_overlap = Q(start_time__lt=end, end_time__gt=start)

    if room:
        room_conflict = base_query.filter(time_overlap, room=room).first()
        if room_conflict:
            return True, f"Room {room} is occupied by '{room_conflict.subject}' at this time."

    if faculty:
        faculty_conflict = base_query.filter(time_overlap, faculty=faculty).first()
        if faculty_conflict:
            return True, f"Faculty {faculty.username} is teaching '{faculty_conflict.subject}' at this time."

    return False, ""

def get_word_overlap(text1, text2):
    if not text1 or not text2:
        return 0
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    if not words1 or not words2:
        return 0
    common = words1.intersection(words2)
    unique = words1.union(words2)
    return len(common) / len(unique)

def find_matches(new_item):
    """
    Calculates match scores for a new LostFoundItem.
    If a strong match is found, marks both items as 'matched' and creates notifications.
    """
    opposite_type = 'found' if new_item.item_type == 'lost' else 'lost'
    potential_matches = LostFoundItem.objects.filter(
        item_type=opposite_type,
        status='open'
    )

    best_match = None
    best_score = 0

    for match in potential_matches:
        score = 0

        # Category match
        if new_item.category == match.category:
            score += 30

        # Title overlap
        title_overlap = get_word_overlap(new_item.title, match.title)
        score += 40 * title_overlap

        # Description overlap
        desc_overlap = get_word_overlap(new_item.description, match.description)
        score += 20 * desc_overlap

        # Location match
        if new_item.location_found_or_lost.lower() == match.location_found_or_lost.lower():
            score += 10

        if score >= 40 and score > best_score:
            best_score = score
            best_match = match

    if best_match:
        # Update both items to matched status
        new_item.status = 'matched'
        new_item.matched_with = best_match
        new_item.save()

        best_match.status = 'matched'
        best_match.matched_with = new_item
        best_match.save()

        # Create notifications for both users
        notify_match(new_item, best_match)
        notify_match(best_match, new_item)

def notify_match(target_item, matching_item):
    message = f"Potential match found! A {matching_item.item_type} item '{matching_item.title}' might match your {target_item.item_type} item '{target_item.title}'. Check it out!"
    Notification.objects.create(
        user=target_item.user,
        message=message,
        link=f"/lost-found/{matching_item.id}"
    )
