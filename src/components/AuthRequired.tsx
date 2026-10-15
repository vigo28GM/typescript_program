// Rāda to formu vietā, kurām vajag tokenu, ja lietotājs nav pieslēdzies
export default function AuthRequired() {
    return (
        <div className="notice">
            <p><b>Šai darbībai jāpieslēdzas.</b> Serveris pieņem šo pieprasījumu tikai ar derīgu tokenu.</p>
            <a href="#account" className="button primary">Pieslēgties</a>
        </div>
    );
}
