import type * as React from 'react';

export function LogoIcon({
  width = 1500,
  height = 1500,
  strokeWidth = 95,
  className = '',
  ...props
}: React.SVGProps<SVGSVGElement> & {
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      version="1.2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1500 1500"
      width={width}
      height={height}
      className={className}
      {...props}
    >
      <style>{`
        .a{fill:none}
        .b{fill:none;stroke:currentColor;stroke-linecap:round;stroke-miterlimit:10;stroke-width:${strokeWidth}}
        .c{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:25}
      `}</style>
      <g fill="currentColor" stroke="currentColor">
        {/* left face */}
        <path
          fillRule="evenodd"
          d="m549.4 979.2q0 0.5 0 1c0.1 5.5 1.1 10.7 2.8 15.5 5.5 13.3 17 22.6 18.9 24q0 0 0 0 3.2 1.9 7 3.9c30.8 16.5 93.4 42.7 172.8 42.7v189.8c-316.6 0-573.2-170.4-573.2-380.6 0-14.1 1.2-28 3.4-41.7-17.4-13.6-37.4-32.1-56.4-56.6-22.3-28.8-35.9-56.6-44.3-77.6-10.5-30.1-4.7-61.5 15-80.1 12.8-12 28-15.5 36-16.6 5.4-0.2 13.7-0.4 23.8 0.2 34.1 2.1 58.6 11.7 64.5 13.8q1.6 0.5 3.3 1l-3.7-4.7c-45.3-79.8-48.5-155.8-13.8-186.7 16.6-14.7 38.7-16.4 42.9-16.7 39-2.4 60.6 27.9 107.7 59.6-11.2-95.5 18.5-172.7 69.6-192.8 10.7-4.3 27.4-8 51.2-3.1 13 5 26.7 13 36.3 26.6 25.3 35.5 1.3 78.3 3.8 153 0.8 21.3 3.7 45.4 10.4 71.8 68.7-19.3 144.2-30 223.5-30v472.4c-58.6 0.3-104.6-18-128-29.7-7.3-4.4-15.8-6.9-25-6.9-26.8 0-48.5 21.7-48.5 48.5zm-99.3-105c0-39.8-32.3-72.1-72-72.1-39.8 0-72.1 32.3-72.1 72.1 0 39.8 32.3 72 72.1 72 39.7 0 72-32.2 72-72z"
        />
        {/* 1st curve */}
        <path
          className="b"
          d="m869.7 570.8c-5.8 18.2-45.6 149.2-40 343.9 4.2 147.7 31.9 240.5 40 265.8"
        />
        {/* 2nd curve */}
        <path
          className="b"
          d="m1068.6 647.3c-15.4 13.5-123 111-108 256 11.3 109.9 86.1 179 108 197.8"
        />
        {/* right eye */}
        <path d="m1117.4 947.7c-39.9 0-72.1-32.2-72.1-72 0-39.9 32.2-72.1 72.1-72.1 39.8 0 72 32.2 72 72.1 0 39.8-32.2 72-72 72z" />

        {/* 1st antenna */}
        <path className="c" d="m1030.4 563.5v-76.9h49.8v-104.3" />
        <path
          className="c"
          d="m1079.9 381.6c-20.8 0-37.5-16.8-37.5-37.5 0-20.7 16.7-37.5 37.5-37.5 20.7 0 37.5 16.8 37.5 37.5 0 20.7-16.8 37.5-37.5 37.5z"
        />
        {/* 2nd antenna */}
        <path className="c" d="m1140.9 594.4v-28.2h137.7v-38.2" />
        <path
          className="c"
          d="m1278.2 527.3c-20.7 0-37.5-16.7-37.5-37.5 0-20.7 16.8-37.5 37.5-37.5 20.7 0 37.5 16.8 37.5 37.5 0 20.8-16.8 37.5-37.5 37.5z"
        />
        {/* 3rd antenna */}
        <path className="c" d="m1343.9 679.4h-59.3v72.9h-80.5" />
        <path
          className="c"
          d="m1381.4 716.9c-20.7 0-37.5-16.8-37.5-37.5 0-20.8 16.8-37.5 37.5-37.5 20.7 0 37.5 16.7 37.5 37.5 0 20.7-16.8 37.5-37.5 37.5z"
        />
      </g>
    </svg>
  );
}

