import styles from "./ScheduleFloorPlan.module.css";

type FloorRoom = {
  id: string;
  label: string;
  selectable: boolean;
  status: "available" | "restricted" | "server" | "construction";
  merged?: boolean;
};

const LEFT_ROOMS: FloorRoom[] = [
  { id: "407-408", label: "407·408호", selectable: false, status: "restricted", merged: true },
  { id: "409", label: "서버실", selectable: false, status: "server" },
  { id: "410", label: "410호", selectable: true, status: "available" },
];

const RIGHT_ROOMS: FloorRoom[] = [
  { id: "406", label: "406호", selectable: true, status: "available" },
  { id: "405", label: "405호", selectable: true, status: "available" },
  { id: "402-403-404", label: "402·403·404호", selectable: false, status: "restricted", merged: true },
];

type Props = {
  selectedRoomIds: Set<string>;
  onToggleRoom: (roomId: string) => void;
};

export default function ScheduleFloorPlan({ selectedRoomIds, onToggleRoom }: Props) {
  const getRoomClass = (room: FloorRoom) => {
    const cls = [styles.roomBox];
    if (room.merged) cls.push(styles.roomMerged);
    else if (room.selectable) {
      cls.push(selectedRoomIds.has(room.id) ? styles.roomSelected : styles.roomUnselected);
    } else {
      if (room.status === "server") cls.push(styles.roomServer);
      else if (room.status === "construction") cls.push(styles.roomConstruction);
      else cls.push(styles.roomRestricted);
    }
    return cls.join(" ");
  };

  const renderRoom = (room: FloorRoom) => (
    <div
      key={room.id}
      className={getRoomClass(room)}
      onClick={() => room.selectable && onToggleRoom(room.id)}
      role={room.selectable ? "button" : undefined}
      tabIndex={room.selectable ? 0 : -1}
      onKeyDown={(e) => {
        if (room.selectable && (e.key === "Enter" || e.key === " ")) onToggleRoom(room.id);
      }}
      aria-pressed={room.selectable ? selectedRoomIds.has(room.id) : undefined}
    >
      <span className={styles.roomName}>{room.label}</span>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>장소 필터</div>
      <div className={styles.grid}>
        <div className={`${styles.column} ${styles.columnLeft}`}>
          {LEFT_ROOMS.map(renderRoom)}
        </div>
        <div className={styles.corridor}>
          <span className={styles.corridorText}>복도</span>
        </div>
        <div className={`${styles.column} ${styles.columnRight}`}>
          {RIGHT_ROOMS.map(renderRoom)}
        </div>
      </div>
    </div>
  );
}
