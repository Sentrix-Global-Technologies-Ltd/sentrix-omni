import { initials } from "../../../lib/principal";

interface AvatarProps {
  src?: string; // URL of the avatar image; omit to show the initials fallback
  alt?: string; // Alt text for the avatar
  /** Shown as a colored initials circle when `src` is not set. */
  name?: string;
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge"; // Avatar size
  status?: "online" | "offline" | "busy" | "none"; // Status indicator
}

const initialsTextClasses = {
  xsmall: "text-[10px]",
  small: "text-xs",
  medium: "text-sm",
  large: "text-base",
  xlarge: "text-lg",
  xxlarge: "text-xl",
};

const sizeClasses = {
  xsmall: "h-6 w-6 max-w-6",
  small: "h-8 w-8 max-w-8",
  medium: "h-10 w-10 max-w-10",
  large: "h-12 w-12 max-w-12",
  xlarge: "h-14 w-14 max-w-14",
  xxlarge: "h-16 w-16 max-w-16",
};

const statusSizeClasses = {
  xsmall: "h-1.5 w-1.5 max-w-1.5",
  small: "h-2 w-2 max-w-2",
  medium: "h-2.5 w-2.5 max-w-2.5",
  large: "h-3 w-3 max-w-3",
  xlarge: "h-3.5 w-3.5 max-w-3.5",
  xxlarge: "h-4 w-4 max-w-4",
};

const statusColorClasses = {
  online: "bg-success-500",
  offline: "bg-error-400",
  busy: "bg-warning-500",
};

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = "medium",
  status = "none",
}) => {
  return (
    <div className={`relative rounded-full ${sizeClasses[size]}`}>
      {src ? (
        <img src={src} alt={alt ?? name ?? "User Avatar"} className="h-full w-full object-cover rounded-full" />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-600 dark:bg-white/10 dark:text-white/90 ${initialsTextClasses[size]}`}
        >
          {initials(name ?? "?")}
        </div>
      )}

      {/* Status Indicator */}
      {status !== "none" && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-[1.5px] border-white dark:border-gray-900 ${
            statusSizeClasses[size]
          } ${statusColorClasses[status] || ""}`}
        ></span>
      )}
    </div>
  );
};

export default Avatar;
